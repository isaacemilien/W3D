import * as THREE from 'three';

class Scene {
  scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#5d5d5c');
  }

  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }
}

export default new Scene();