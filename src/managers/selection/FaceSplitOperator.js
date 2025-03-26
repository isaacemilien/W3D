// src/managers/selection/FaceSplitOperator.js
import * as THREE from 'three';

class FaceSplitOperator {
    constructor(heMesh) {
        this.heMesh = heMesh;
    }
    
    /**
     * Split a face along a specified direction
     * @param {Object} face - The face to split
     * @param {string} direction - Split direction ('horizontal' or 'vertical')
     * @returns {Object|null} - The result of the split operation or null if failed
     */
    splitFace(face, direction = 'horizontal') {
        if (!face || !this.heMesh) {
            console.warn('Cannot split face: missing face or mesh');
            return null;
        }
        
        return this.heMesh.splitFace(face, direction);
    }
    
    /**
     * Determine the best split direction based on the face's shape
     * @param {Object} face - The face to analyze
     * @returns {string} - 'horizontal' or 'vertical'
     */
    determineBestSplitDirection(face) {
        // Get the vertices of the face
        const vertices = this.heMesh.collectVerticesOfFace(face);
        
        if (vertices.length !== 4) {
            return 'horizontal'; // Default to horizontal for non-quad faces
        }
        
        // Calculate the width and height of the face
        // For simplicity, use the distance between opposing vertices
        const v0 = vertices[0].position;
        const v1 = vertices[1].position;
        const v2 = vertices[2].position;
        const v3 = vertices[3].position;
        
        const horizontalDist1 = v0.distanceTo(v2);
        const horizontalDist2 = v1.distanceTo(v3);
        const verticalDist1 = v0.distanceTo(v1);
        const verticalDist2 = v2.distanceTo(v3);
        
        // Get the average width and height
        const avgWidth = (horizontalDist1 + horizontalDist2) / 2;
        const avgHeight = (verticalDist1 + verticalDist2) / 2;
        
        // Return the direction based on which dimension is larger
        return avgWidth > avgHeight ? 'vertical' : 'horizontal';
    }
}

export default FaceSplitOperator;