// Tiny self-contained 3D turntable for the class-select screen. Loads a single
// character model and spins it. Fully fail-safe: if the model is missing it just
// shows nothing and the screen falls back to a styled placeholder.

import * as THREE from "three";
import { PALETTE } from "../config/palette.js";
import { loadCharacter } from "../view/assets.js";

export class Preview {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._resize();
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    this.camera.position.set(0, 1.3, 4.2);
    this.camera.lookAt(0, 1.0, 0);

    this.scene.add(new THREE.HemisphereLight(0x9ab87f, 0x0a0a06, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 4, 3);
    this.scene.add(key);
    const rim = new THREE.PointLight(PALETTE.plague, 1.0, 12, 2);
    rim.position.set(-2, 2, -2);
    this.scene.add(rim);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this.model = null;
    this.running = false;
    this._token = 0; // guards against out-of-order async loads
    this._loop = this._loop.bind(this);
  }

  _resize() {
    const w = this.container.clientWidth || 320;
    const h = this.container.clientHeight || 360;
    this.renderer.setSize(w, h, false);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  async setModel(file) {
    const token = ++this._token;
    if (this.model) {
      this.pivot.remove(this.model);
      this.model = null;
    }
    const res = await loadCharacter(file);
    if (!res || token !== this._token) return false; // missing, or superseded
    const m = res.scene;
    const box = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y > 0.0001) m.scale.setScalar(1.9 / size.y);
    const b2 = new THREE.Box3().setFromObject(m);
    m.position.y -= b2.min.y;
    m.position.x -= (b2.min.x + b2.max.x) / 2;
    m.position.z -= (b2.min.z + b2.max.z) / 2;
    this.pivot.add(m);
    this.model = m;
    return true;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._resize();
    requestAnimationFrame(this._loop);
  }
  stop() {
    this.running = false;
  }

  _loop() {
    if (!this.running) return;
    this.pivot.rotation.y += 0.012;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._loop);
  }
}
