import * as THREE from 'three';

class Scene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background =  new THREE.Color('#5d5d5c');
    }

    addObject(object) {
        this.scene.add(object);
    }

    removeObject(object) {
        this.scene.remove(object);
    }
}

export default new Scene();
