// Copy Draco decoders into /public so GLTFLoader can load them from our own origin.
import { cpSync, existsSync } from 'node:fs';

const src = 'node_modules/three/examples/jsm/libs/draco/gltf';
try {
  if (existsSync(src)) {
    cpSync(src, 'public/draco', { recursive: true });
    console.log('[postinstall] Draco decoders copied to public/draco');
  }
} catch (err) {
  console.warn('[postinstall] Could not copy Draco decoders:', err.message);
}
