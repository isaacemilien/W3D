import * as THREE from 'three';

class Renderer {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }
}

export default new Renderer();
