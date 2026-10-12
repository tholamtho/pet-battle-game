import * as THREE from 'three';
import { EVENT, SIDE } from '@/config/constants.js';
import { getSkill } from '@/data/index.js';
import { createPetModel } from './PetFactory.js';
import { Effects } from './fx.js';

/** Stage + the two pets. Events arrive already in "player/enemy" terms (see game/perspective.js). */
export class BattleScene {
  constructor(renderer, assets) {
    this.renderer = renderer;
    this.assets = assets;
    this.models = {};
    this.fx = new Effects(renderer.scene);
    this.#buildStage();
  }

  #buildStage() {
    const { scene } = this.renderer;
    scene.background = new THREE.Color(0x141a2b);
    scene.fog = new THREE.Fog(0x141a2b, 14, 30);
    scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x2a2438, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(4, 8, 5);
    sun.castShadow = true;
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshStandardMaterial({ color: 0x252e48, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  /** equipment = { player: [{slot,itemId}], enemy: [...] }: both sides are shown wearing their gear. */
  async setCombatants(playerSpecies, enemySpecies, equipment = {}) {
    Object.values(this.models).forEach((m) => m.dispose());
    const [player, enemy] = await Promise.all([createPetModel(playerSpecies, this.assets, equipment.player), createPetModel(enemySpecies, this.assets, equipment.enemy)]);
    player.setHome(-2.6, 0, 0);
    player.root.rotation.y = Math.PI / 2; // face +x
    enemy.setHome(2.6, 0, 0);
    enemy.root.rotation.y = -Math.PI / 2; // face -x
    this.renderer.scene.add(player.root, enemy.root);
    this.models = { [SIDE.PLAYER]: player, [SIDE.ENEMY]: enemy };
  }

  /** onImpact fires exactly when the hit lands, so the HUD can drop HP in sync with the animation. */
  async playEvent(event, { onImpact } = {}) {
    const { models } = this;
    switch (event.type) {
      case EVENT.ATTACK:
      case EVENT.MISS: {
        const skill = getSkill(event.skillId);
        const attacker = models[event.side];
        const target = models[event.targetSide];
        const dir = event.side === SIDE.PLAYER ? 1 : -1;
        let reacted;
        await attacker.perform(skill, {
          direction: dir,
          onImpact: () => {
            if (event.type !== EVENT.ATTACK) return;
            onImpact?.();
            const at = target.root.position.clone().setY(1.1);
            this.fx.burst(at, skill.element, skill.anim === 'special');
            reacted = target.react();
          },
        });
        await reacted;
        break;
      }
      case EVENT.FAINT:
        await models[event.side].faint();
        break;
    }
  }

  update(dt) {
    Object.values(this.models).forEach((m) => m.update(dt));
    this.fx.update(dt);
  }
}
