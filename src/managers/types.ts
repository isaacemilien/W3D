import * as THREE from 'three';
import { HalfedgeDS} from 'three-mesh-halfedge';

/**
 * Interface representing a wrapper for a mesh with its half-edge structure
 */
export interface MeshWrapper {
    /**
     * The Three.js object representing the mesh
     */
    object: THREE.Object3D;
    
    /**
     * The half-edge structure representing the mesh topology
     */
    heStruct: HalfedgeDS;
}

export type SelectionMode = 'OBJECT' | 'VERTEX' | 'EDGE' | 'FACE';
