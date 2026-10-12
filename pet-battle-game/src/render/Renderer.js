import * as THREE from 'three';

export class Renderer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 3.2, 9);
    this.camera.lookAt(0, 1, 0);

    this.gl = new THREE.WebGLRenderer({ antialias: true });
    this.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.gl.shadowMap.enabled = true;
    container.appendChild(this.gl.domElement);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.gl.setSize(w, h);
    this.camera.aspect = w / h;
    // Portrait screens: pull the camera back so both pets stay in frame.
    this.camera.position.z = w / h < 1 ? 13 : 9;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.gl.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.gl.dispose();
    this.gl.domElement.remove();
  }
}
