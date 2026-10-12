import { env } from '@/config/env.js';
import { Renderer } from '@/render/Renderer.js';
import { AssetLoader } from '@/render/AssetLoader.js';
import { BattleScene } from '@/render/BattleScene.js';
import { UIRoot } from '@/ui/UIRoot.js';
import { ScreenHost } from '@/ui/screens/ScreenHost.js';
import { AuthScreen } from '@/ui/screens/AuthScreen.js';
import { MenuScreen, QueueScreen } from '@/ui/screens/MenuScreen.js';
import { HubScreen } from '@/ui/screens/HubScreen.js';
import { Loop } from '@/core/Loop.js';
import { BattleController } from './BattleController.js';
import { LocalSession } from './sessions/LocalSession.js';
import { PveSession } from './sessions/PveSession.js';
import { PvpSession } from './sessions/PvpSession.js';
import { BattleSocket } from '@/net/BattleSocket.js';
import { authApi } from '@/api/authApi.js';
import { battlesApi } from '@/api/battlesApi.js';
import { catalogApi } from '@/api/catalogApi.js';
import { mapsApi } from '@/api/mapsApi.js';
import { petsApi } from '@/api/petsApi.js';
import { playersApi } from '@/api/playersApi.js';
import { setUnauthorizedHandler } from '@/api/httpClient.js';
import { authStore } from '@/store/authStore.js';
import { listSpecies, useCatalog } from '@/data/index.js';
import { logger } from '@/utils/logger.js';

/** Composition root + screen flow: auth -> menu -> battle -> menu. */
export class Game {
  inBattle = false;
  socket = null;

  constructor({ stageEl, uiEl }) {
    this.renderer = new Renderer(stageEl);
    this.scene = new BattleScene(this.renderer, new AssetLoader());
    this.ui = new UIRoot(uiEl);
    this.screens = new ScreenHost(uiEl);
    this.battle = new BattleController({ scene: this.scene, ui: this.ui });
    this.loop = new Loop((dt) => {
      this.scene.update(dt);
      this.renderer.render();
    });

    this.auth = AuthScreen({
      online: Boolean(env.apiUrl),
      onLogin: (u, p) => this.#signIn(() => authApi.login(u, p)),
      onRegister: (u, p) => this.#signIn(() => authApi.register(u, p)),
      onOffline: () => this.#runBattle(new LocalSession()),
    });
    this.menu = MenuScreen({
      onStarter: async (id) => (await playersApi.chooseStarter(id), this.#showMenu()),
      onWild: async (mapId) => {
        await mapsApi.enter(mapId);
        await this.#runBattle(await PveSession.start());
      },
      onPvp: () => this.#findMatch(),
      onHub: async () => {
        await this.hub.load();
        this.screens.show(this.hub.el);
      },
      onPractice: () => this.#runBattle(new LocalSession()),
      onLogout: () => this.#logout(),
    });
    this.hub = HubScreen({ onBack: () => this.#showMenu().catch(() => this.#showAuth()) });
    this.queue = QueueScreen({ onCancel: () => this.cancelQueue?.() });
    setUnauthorizedHandler(() => !this.inBattle && this.#logout());
  }

  async start() {
    this.loop.start();
    authStore.init();
    if (env.apiUrl) {
      try {
        useCatalog(await catalogApi.get());
      } catch (err) {
        logger.warn('Could not load the server catalog, using the bundled one', err);
      }
    }
    if (authStore.token) {
      this.#connectSocket();
      await this.#showMenu().catch(() => this.#showAuth());
    } else {
      this.#showAuth();
    }
  }

  #showAuth() {
    this.screens.show(this.auth.el);
  }

  async #signIn(authenticate) {
    await authenticate();
    this.#connectSocket();
    await this.#showMenu();
  }

  #logout() {
    authApi.logout();
    this.socket?.close();
    this.socket = null;
    this.#showAuth();
  }

  #connectSocket() {
    if (this.socket || !env.wsUrl) return;
    this.socket = new BattleSocket(env.wsUrl, () => authStore.token);
    // The server re-sends the battle after a reload/reconnect: jump straight back into it.
    this.socket.on('battle.resume', (m) => !this.inBattle && this.#runBattle(new PvpSession(this.socket, m)));
    this.socket.connect().catch((err) => logger.warn('Battle server unavailable', err));
  }

  async #showMenu() {
    const active = await battlesApi.active();
    if (active) return this.#runBattle(PveSession.fromView(active));
    const [player, pets, maps] = await Promise.all([playersApi.me(), petsApi.list(), mapsApi.list()]);
    this.menu.render({ player, pets, maps, starters: listSpecies().filter((s) => s.isStarter) });
    this.screens.show(this.menu.el);
  }

  async #findMatch() {
    if (!this.socket?.ready) throw new Error('The battle server is not reachable yet. Try again in a moment.');
    this.screens.show(this.queue.el);
    let match;
    try {
      match = await new Promise((resolve, reject) => {
        const offs = [];
        const settle = (fn) => (m) => (offs.forEach((off) => off()), fn(m));
        offs.push(this.socket.on('battle.start', settle(resolve)), this.socket.on('error', settle((m) => reject(new Error(m.message)))));
        this.cancelQueue = () => {
          offs.forEach((off) => off());
          this.socket.send({ type: 'queue.leave' });
          reject(Object.assign(new Error('Cancelled'), { name: 'Cancelled' }));
        };
        this.socket.send({ type: 'queue.join' });
      });
    } catch (err) {
      await this.#showMenu();
      if (err.name !== 'Cancelled') this.menu.setStatus(err.message);
      return;
    }
    await this.#runBattle(new PvpSession(this.socket, match));
  }

  async #runBattle(session) {
    this.screens.hide();
    this.inBattle = true;
    try {
      await this.battle.run(session);
    } finally {
      this.inBattle = false;
      session.close();
    }
    if (authStore.token) await this.#showMenu().catch(() => this.#showAuth());
    else this.#showAuth();
  }

  dispose() {
    this.loop.stop();
    this.socket?.close();
    this.renderer.dispose();
  }
}
