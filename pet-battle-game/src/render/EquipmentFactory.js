import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DEFAULT_ITEM_CONFIG } from './animation/config.js';
import { env } from '@/config/env.js';
import { logger } from '@/utils/logger.js';

/**
 * Convention: public/items/<itemId>/model.glb + config.json  { model, scale, offset, rotation }
 * No folder => a simple placeholder shape for the slot, tinted by rarity.
 */
export const itemAssetUrl = (itemId, file = '') => `${env.baseUrl}items/${itemId}/${file}`;

const RARITY_COLORS = { common: 0xb8bfd6, rare: 0x4aa8ff, epic: 0xb06bff, legendary: 0xffc94a };
const configCache = new Map();

export function loadItemConfig(itemId) {
  if (!configCache.has(itemId)) {
    configCache.set(
      itemId,
      fetch(itemAssetUrl(itemId, 'config.json'))
        .then(async (res) => {
          if (!res.ok) return null;
          try {
            return { ...DEFAULT_ITEM_CONFIG, ...(await res.json()) };
          } catch {
            return null; // dev servers answer unknown paths with index.html
          }
        })
        .catch(() => null),
    );
  }
  return configCache.get(itemId);
}

function createPlaceholder(item) {
  const material = new THREE.MeshStandardMaterial({ color: RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common, roughness: 0.5 });
  const group = new THREE.Group();
  let mesh;
  switch (item.slot) {
    case 'head':
      mesh = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.5, 16), material);
      mesh.position.y = 0.25;
      break;
    case 'body':
      mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 8, 24), material);
      mesh.rotation.x = Math.PI / 2;
      break;
    case 'back':
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.07), material);
      break;
    default:
      mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), material);
  }
  mesh.castShadow = true;
  group.add(mesh);
  return group;
}

/** -> { object, config } ready for PetModel.equip(slot, object, config) */
export async function createEquipmentObject(item, assets) {
  const config = await loadItemConfig(item.id);
  if (config) {
    try {
      const gltf = await assets.loadGLTF(/^https?:|^blob:/.test(config.model) ? config.model : itemAssetUrl(item.id, config.model));
      const object = cloneSkinned(gltf.scene);
      object.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });
      return { object, config };
    } catch (err) {
      logger.warn(`Model for item "${item.id}" failed to load, using placeholder`, err);
    }
  }
  return { object: createPlaceholder(item), config: DEFAULT_ITEM_CONFIG };
}
