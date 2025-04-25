import * as THREE from 'three';

class Lighting {
    ambientLight: THREE.AmbientLight;
    directionalLight: THREE.DirectionalLight;

    constructor() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(5, 5, 5);
    }

    addToScene(scene: THREE.Scene): void {
        scene.add(this.ambientLight);
        scene.add(this.directionalLight);
    }
}

export default new Lighting();
