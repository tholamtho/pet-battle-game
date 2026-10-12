import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { env } from '@/config/env.js';

/** Loads and caches .glb files. Supports Draco and Meshopt compressed models. */
export class AssetLoader {
  #cache = new Map();

  constructor() {
    const draco = new DRACOLoader().setDecoderPath(`${env.baseUrl}draco/`);
    this.gltf = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
  }

  loadGLTF(url) {
    if (!this.#cache.has(url)) {
      const promise = this.gltf.loadAsync(url).catch((err) => {
        this.#cache.delete(url); // allow retry
        throw err;
      });
      this.#cache.set(url, promise);
    }
    return this.#cache.get(url);
  }
}
