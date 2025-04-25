import * as THREE from 'three';

export class Renderer {
  public renderer: THREE.WebGLRenderer;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
} 

export default new Renderer()
