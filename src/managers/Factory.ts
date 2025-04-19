import * as THREE from 'three'
import Scene from '../core/Scene';
import { HalfedgeDS } from 'three-mesh-halfedge';
import Queries from './Queries';
import SceneGraph from './SceneGraph';
import { extrudeFace } from './Operations';

class Factory {

    // static createCubeHEDS() {
    //     const heMesh = new HEMesh();
    //     heMesh.createBox();
    //     const sphereGeom = heMesh.toBufferGeometry();
    //     const material = new THREE.MeshStandardMaterial();

    //     const object = new THREE.Mesh(sphereGeom, material);
    //     object.userData.name = "pCube";

    //     return { object, heMesh }
    // }

    static createCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
        const material = new THREE.MeshStandardMaterial({ color: 0x6699ff, metalness: 0, roughness: 0.5 });

        const struct = new HalfedgeDS();
        struct.setFromGeometry(geometry, 1e-10);


        const bonkersStruct = extrudeFace(struct, struct.faces[9], 1);

        const newGeometry = Queries.halfedgeToGeometry(bonkersStruct);

        const mesh = new THREE.Mesh(newGeometry, material);
        
        SceneGraph.addObject(mesh as unknown as THREE.Object3D, bonkersStruct);
    }

    static createSphere(radius = 1, widthSegments = 32, heightSegments = 32) {
        const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const material = new THREE.MeshStandardMaterial({ color: 0xff7700 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.userData.name = "My sphere";

        return sphere;
    }

    static createCuboid(width = 1, height = 1, depth = 1) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff77 });
        const cuboid = new THREE.Mesh(geometry, material);
        cuboid.userData.name = "My cuboid";

        return cuboid;
    }
}

export default Factory;
