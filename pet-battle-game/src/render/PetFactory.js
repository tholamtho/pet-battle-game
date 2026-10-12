import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PetModel } from './PetModel.js';
import { createEquipmentObject } from './EquipmentFactory.js';
import { getItem } from '@/data/index.js';
import { DEFAULT_CONFIG } from './animation/config.js';
import { env } from '@/config/env.js';
import { logger } from '@/utils/logger.js';

/**
 * Convention: public/pets/<speciesId>/config.json  (+ the .glb it points to, default model.glb)
 * No folder / no config.json  =>  placeholder model. Adding a pet's art never touches code.
 */
export const petAssetUrl = (speciesId, file = '') => `${env.baseUrl}pets/${speciesId}/${file}`;

const configCache = new Map();

export function loadPetConfig(speciesId) {
  if (!configCache.has(speciesId)) {
    configCache.set(
      speciesId,
      fetch(petAssetUrl(speciesId, 'config.json'))
        .then(async (res) => {
          if (!res.ok) return null;
          try {
            return { ...DEFAULT_CONFIG, ...(await res.json()) };
          } catch {
            return null; // dev servers answer unknown paths with index.html
          }
        })
        .catch(() => null),
    );
  }
  return configCache.get(speciesId);
}

export function buildModelFromGltf(gltf, config) {
  const holder = new THREE.Group();
  const model = cloneSkinned(gltf.scene);
  model.scale.setScalar(config.scale);
  model.rotation.y = config.rotationY;
  model.position.y = config.yOffset;
  model.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  holder.add(model);
  return new PetModel({ root: holder, model, clips: gltf.animations, config });
}

export function createPlaceholder(species) {
  const colors = { fire: 0xff7a45, water: 0x4aa8ff, grass: 0x6bd66b };
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.55, 0.8, 8, 16),
    new THREE.MeshStandardMaterial({ color: colors[species.elements?.[0]] ?? 0xb8bfd6, roughness: 0.55 }),
  );
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const x of [-0.22, 0.22]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), eyeMat);
    eye.position.set(x, 1.3, 0.48);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pupilMat);
    pupil.position.set(x, 1.3, 0.58);
    group.add(eye, pupil);
  }
  return new PetModel({ root: group });
}

async function createBaseModel(species, assets) {
  const config = await loadPetConfig(species.id);
  if (config) {
    try {
      const gltf = await assets.loadGLTF(/^https?:|^blob:/.test(config.model) ? config.model : petAssetUrl(species.id, config.model));
      return buildModelFromGltf(gltf, config);
    } catch (err) {
      logger.warn(`Model for "${species.id}" failed to load, using placeholder`, err);
    }
  }
  return createPlaceholder(species);
}

/** equipment = [{ slot, itemId }]. Unknown items are skipped so a newer server never breaks an older client. */
export async function applyEquipment(petModel, equipment = [], assets) {
  await Promise.all(
    equipment.map(async ({ slot, itemId }) => {
      const item = getItem(itemId);
      if (!item) return;
      const { object, config } = await createEquipmentObject(item, assets);
      petModel.equip(slot, object, config);
    }),
  );
}

export async function createPetModel(species, assets, equipment = []) {
  const model = await createBaseModel(species, assets);
  await applyEquipment(model, equipment, assets).catch((err) => logger.warn('Could not attach equipment', err));
  return model;
}
