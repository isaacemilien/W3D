import * as THREE from 'three';
import Scene from './Scene';

class Lighting {
    constructor() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        Scene.addObject(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(10, 10, 10);
        Scene.addObject(this.directionalLight);
    }
}

export default new Lighting();
