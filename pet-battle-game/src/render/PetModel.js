import * as THREE from 'three';
import { DEFAULT_CONFIG, STATES } from './animation/config.js';
import { resolveSkillClip, resolveStateClip } from './animation/resolveClip.js';
import { resolveSocket } from './animation/sockets.js';
import { easeOutQuad } from '@/utils/math.js';
import { logger } from '@/utils/logger.js';

/**
 * One pet on stage. Plays the pet's own glTF clips when it has them, and falls back to
 * procedural motion for any state it doesn't (so a pet with only an idle clip still works).
 * Which clip means what comes from the pet's config.json + naming convention, never from code.
 */
export class PetModel {
  constructor({ root, model = root, clips = [], config = {} }) {
    this.root = root; // what the scene positions/rotates
    this.model = model; // what the AnimationMixer animates
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.clipNames = clips.map((c) => c.name);
    this.mixer = clips.length ? new THREE.AnimationMixer(model) : null;
    this.actions = new Map(clips.map((c) => [c.name, this.mixer.clipAction(c)]));
    this.idleClip = resolveStateClip('idle', this.clipNames, this.config);
    this.current = null;
    this.equipped = new Map();
    this.tweens = [];
    this.time = Math.random() * 10;
    this.fainted = false;
    this.home = root.position.clone();
    this.#warnUnknownClips();
    this.#toIdle(0);
  }

  #warnUnknownClips() {
    for (const [state, name] of Object.entries(this.config.animations ?? {})) {
      if (!STATES.includes(state)) logger.warn(`config.animations: unknown state "${state}"`);
      else if (!resolveStateClip(state, this.clipNames, this.config)) logger.warn(`config.animations.${state}: clip "${name}" not found. Clips: ${this.clipNames.join(', ')}`);
    }
  }

  /** For the model viewer: which clip is each state using? */
  describe() {
    const states = Object.fromEntries(STATES.map((s) => [s, resolveStateClip(s, this.clipNames, this.config)]));
    return { clips: this.clipNames, states };
  }

  setHome(x, y, z) {
    this.root.position.set(x, y, z);
    this.home = this.root.position.clone();
  }

  // ---- equipment ----
  /** Attaches a 3D object to this pet's socket for `slot` (a bone, so it follows the animation, or a fixed point). */
  equip(slot, object, itemConfig = {}) {
    this.unequip(slot);
    const socket = resolveSocket(slot, this.config, itemConfig);
    const bone = socket.bone ? this.model.getObjectByName(socket.bone) : null;
    if (socket.bone && !bone) logger.warn(`sockets.${slot}: bone "${socket.bone}" not found, attaching to the pet root instead`);
    object.position.set(...socket.position);
    object.rotation.set(...socket.rotation);
    object.scale.setScalar(socket.scale);
    (bone ?? this.root).add(object);
    this.equipped.set(slot, object);
  }

  unequip(slot) {
    this.equipped.get(slot)?.removeFromParent();
    this.equipped.delete(slot);
  }

  // ---- time helpers (driven by update(dt), so they follow the render loop) ----
  tween(duration, onUpdate) {
    return new Promise((resolve) => this.tweens.push({ t: 0, duration: Math.max(duration, 0.001), onUpdate, resolve }));
  }
  wait(seconds) {
    return this.tween(seconds, () => {});
  }

  // ---- clip playback ----
  #playOnce(clipName, { timeScale = 1 } = {}) {
    const action = this.actions.get(clipName);
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = timeScale;
    if (this.current && this.current !== action) action.crossFadeFrom(this.current, 0.12, false);
    action.play();
    this.current = action;
    const duration = action.getClip().duration / Math.abs(timeScale);
    const finished = new Promise((resolve) => {
      const onDone = (e) => {
        if (e.action !== action) return;
        this.mixer.removeEventListener('finished', onDone);
        resolve();
      };
      this.mixer.addEventListener('finished', onDone);
    });
    // Never hang the battle if a clip fails to report completion.
    return { duration, finished: Promise.race([finished, this.wait(duration + 0.5)]) };
  }

  #toIdle(fade = 0.15) {
    if (this.fainted) return;
    const action = this.idleClip && this.actions.get(this.idleClip);
    if (action) {
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      if (this.current && this.current !== action && fade > 0) action.crossFadeFrom(this.current, fade, false);
      action.play();
      this.current = action;
    } else if (this.mixer) {
      this.mixer.stopAllAction();
      this.current = null;
    }
  }

  // ---- public animations ----
  /** Uses a skill. onImpact fires at the moment the hit should land (so HP, hit reaction and VFX line up). */
  async perform(skill, { direction = 1, onImpact } = {}) {
    const { clipName, state } = resolveSkillClip(skill, this.clipNames, this.config);
    if (clipName) {
      const { duration, finished } = this.#playOnce(clipName);
      const key = state === 'special' ? 'specialImpact' : 'attackImpact';
      const impactAt = Math.min(this.config.timing?.[key] ?? duration * 0.45, duration);
      const slide = this.config.lunge ? this.#lunge(direction, duration) : Promise.resolve();
      await this.wait(impactAt);
      onImpact?.();
      await Promise.all([finished, slide]);
    } else {
      await (state === 'special' ? this.#proceduralSpecial(direction, onImpact) : this.#proceduralAttack(direction, onImpact));
    }
    this.#toIdle();
  }

  /** Reaction to being hit. */
  async react() {
    if (this.fainted) return;
    const clip = resolveStateClip('hit', this.clipNames, this.config);
    if (clip) {
      await this.#playOnce(clip).finished;
    } else {
      await this.tween(0.3, (t) => (this.root.position.x = this.home.x + Math.sin(t * Math.PI * 6) * 0.15 * (1 - t)));
      this.root.position.x = this.home.x;
    }
    this.#toIdle();
  }

  async faint() {
    this.fainted = true;
    const clip = resolveStateClip('faint', this.clipNames, this.config);
    if (clip) {
      await this.#playOnce(clip).finished;
    } else {
      await this.tween(0.6, (t) => {
        this.root.rotation.z = (Math.PI / 2) * easeOutQuad(t);
        this.root.position.y = this.home.y - 0.4 * t;
      });
    }
  }

  // ---- procedural fallbacks ----
  async #lunge(direction, total) {
    const reach = 1.4 * direction;
    await this.tween(total * 0.4, (t) => (this.root.position.x = this.home.x + reach * easeOutQuad(t)));
    await this.tween(total * 0.4, (t) => (this.root.position.x = this.home.x + reach * (1 - t)));
    this.root.position.x = this.home.x;
  }

  async #proceduralAttack(direction, onImpact) {
    const reach = 1.6 * direction;
    await this.tween(0.22, (t) => (this.root.position.x = this.home.x + reach * easeOutQuad(t)));
    onImpact?.();
    await this.tween(0.25, (t) => (this.root.position.x = this.home.x + reach * (1 - t)));
    this.root.position.x = this.home.x;
  }

  async #proceduralSpecial(direction, onImpact) {
    const baseRotY = this.root.rotation.y;
    await this.tween(0.35, (t) => (this.root.scale.y = 1 - 0.25 * t)); // crouch / charge
    const jump = this.tween(0.45, (t) => {
      this.root.scale.y = 0.75 + 0.25 * easeOutQuad(t);
      this.root.position.y = this.home.y + 1.4 * Math.sin(Math.PI * t);
      this.root.position.x = this.home.x + direction * 2.2 * t;
      this.root.rotation.y = baseRotY + Math.PI * 2 * t;
    });
    await this.wait(0.3);
    onImpact?.();
    await jump;
    await this.tween(0.3, (t) => (this.root.position.x = this.home.x + direction * 2.2 * (1 - t)));
    Object.assign(this.root.position, { x: this.home.x, y: this.home.y });
    this.root.rotation.y = baseRotY;
    this.root.scale.y = 1;
  }

  update(dt) {
    this.time += dt;
    this.mixer?.update(dt);
    for (const tw of this.tweens) {
      tw.t = Math.min(1, tw.t + dt / tw.duration);
      tw.onUpdate(tw.t);
      if (tw.t >= 1) tw.resolve();
    }
    this.tweens = this.tweens.filter((tw) => tw.t < 1);
    if (!this.fainted && !this.idleClip && this.tweens.length === 0) {
      this.root.position.y = this.home.y + Math.sin(this.time * 2.2) * 0.06; // procedural idle
    }
  }

  dispose() {
    this.root.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => m.dispose());
    });
    this.root.removeFromParent();
  }
}
