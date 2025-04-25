import * as THREE from 'three'
import { HalfedgeDS } from 'three-mesh-halfedge';
import Queries from './Queries';
import SceneGraph from './SceneGraph';
import { extrudeFace } from './Operations';
import { Wrapper } from './types';
import { LogicalMesh } from './LogicalMesh';
import { RenderMesh } from './RenderMesh';
import Scene from '../core/Scene';

class Factory {

    static createCube(): Wrapper {
        const logical = LogicalMesh.createCube(1);
        
        const material = new THREE.MeshStandardMaterial({ color: 0x6699ff, metalness: 0, roughness: 0.5 });
        const render = new RenderMesh(material)
        render.updateFrom(logical);

        return {logical, render}
    }

    // static createCube() {
    //     const geometry = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
    //     const material = new THREE.MeshStandardMaterial({ color: 0x6699ff, metalness: 0, roughness: 0.5 });

    //     const struct = new HalfedgeDS();
    //     struct.setFromGeometry(geometry, 1e-10);

    //     const mesh = new THREE.Mesh(geometry, material);
        
    //     SceneGraph.addObject(mesh as unknown as THREE.Object3D, struct);
    // }
}

export default Factory;
