import * as THREE from 'three';
import Scene from '../core/Scene';

class PrimitiveFactory {
    static createCube(size = 1) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
        const cube = new THREE.Mesh(geometry, material);
        return cube;
    }

    static createSphere(radius = 1, widthSegments = 32, heightSegments = 32) {
        const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const material = new THREE.MeshStandardMaterial({ color: 0xff7700 });
        const sphere = new THREE.Mesh(geometry, material);
        return sphere;
    }

    static createCuboid(width = 1, height = 1, depth = 1) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff77 });
        const cuboid = new THREE.Mesh(geometry, material);
        return cuboid;
    }
}

export default PrimitiveFactory;
