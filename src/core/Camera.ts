import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class Camera {
    public camera: THREE.PerspectiveCamera;
    public controls: OrbitControls;

    constructor() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);

        const canvas = document.querySelector('canvas');
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
    }

    public update(): void {
        this.controls.update();
    }
}

export default new Camera();