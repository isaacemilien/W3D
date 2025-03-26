// src/managers/selection/ExtrusionOperator.js
import * as THREE from 'three';
import MeshOperations from '../MeshOperations';

class ExtrusionOperator {
    constructor(heMesh) {
        this.heMesh = heMesh;
        this.meshOperations = MeshOperations;
    }
    
    extrudeFace(face, distance = 1.0, scale = 1.0) {
        if (!face || !this.heMesh) {
            console.warn('Cannot extrude: missing face or mesh');
            return null;
        }
        
        // Delegate to the MeshOperations utility class
        return this.meshOperations.extrudeFace(this.heMesh, face, distance, scale);
    }
    
}

export default ExtrusionOperator;