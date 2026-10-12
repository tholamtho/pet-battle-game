import * as THREE from 'three';

const COLORS = { fire: 0xff7a45, water: 0x4aa8ff, grass: 0x6bd66b, normal: 0xe9ecf5 };
const geometry = new THREE.SphereGeometry(0.09, 6, 6);

/** Tiny impact particles, tinted by the skill's element. Placeholder until you author real VFX. */
export class Effects {
  #items = [];

  constructor(scene) {
    this.scene = scene;
  }

  burst(position, element = 'normal', big = false) {
    const color = COLORS[element] ?? COLORS.normal;
    const count = big ? 26 : 10;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true }));
      mesh.position.copy(position);
      mesh.scale.setScalar(big ? 1.8 : 1);
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize();
      this.#items.push({ mesh, vel: dir.multiplyScalar(big ? 4.2 : 2.4), life: 0, max: big ? 0.7 : 0.45 });
      this.scene.add(mesh);
    }
  }

  update(dt) {
    this.#items = this.#items.filter((it) => {
      it.life += dt;
      const k = it.life / it.max;
      it.mesh.position.addScaledVector(it.vel, dt);
      it.mesh.material.opacity = Math.max(0, 1 - k);
      if (k < 1) return true;
      it.mesh.removeFromParent();
      it.mesh.material.dispose();
      return false;
    });
  }
}
