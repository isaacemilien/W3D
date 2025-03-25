import * as THREE from 'three';

class MeshOperations {
    constructor() {
        // Can store any global settings for mesh operations
    }

    /**
     * Extrudes a face along its normal direction
     * 
     * @param {Object} heMesh - The half-edge mesh to operate on
     * @param {Object} face - The face to extrude
     * @param {number} distance - How far to extrude the face
     * @param {number} scale - Scale factor for the extruded face
     * @returns {Object|null} - The newly created face, or null if operation failed
     */
    extrudeFace(heMesh, face, distance = 1.0, scale = 1.0) {
        if (!face) {
            console.warn("No face provided for extrusion");
            return null;
        }

        // Use the utility methods to collect face data
        const faceNormal = this.calculateFaceNormal(face);
        const faceCenter = this.calculateFaceCenter(face);
        const originalVertices = this.collectFaceVertices(face);
        
        // Create extruded vertices
        const vertexMap = new Map();
        const newVertices = [];
        
        for (const vertex of originalVertices) {
            // Create new vertex using createExtrudedVertex helper method
            const newVertex = this.createExtrudedVertex(
                heMesh, 
                vertex, 
                faceCenter, 
                faceNormal, 
                distance, 
                scale
            );
            
            newVertices.push(newVertex);
            vertexMap.set(vertex, newVertex);
        }
        
        // Create side faces - one quad for each edge of the original face
        const sideFaces = [];
        for (let i = 0; i < originalVertices.length; i++) {
            const v1 = originalVertices[i];
            const v2 = originalVertices[(i + 1) % originalVertices.length];
            const v3 = vertexMap.get(v2);
            const v4 = vertexMap.get(v1);
            
            // Use the helper method to create a side face
            const newFace = this.createSideFace(heMesh, v1, v2, v3, v4);
            
            if (newFace) {
                sideFaces.push(newFace);
            }
        }
        
        // Create the top face
        const topFace = heMesh.createFace(newVertices);
        
        if (!topFace) {
            console.error("Failed to create top face during extrusion");
            return null;
        }
        
        // Remove the original face
        heMesh.removeFace(face);
        
        return {
            topFace,
            sideFaces
        };
    }
    
    /**
     * Calculates the normal vector of a face
     */
    calculateFaceNormal(face) {
        const normal = new THREE.Vector3();
        
        // Use the first three vertices to calculate normal
        let edge = face.edge;
        const v1 = edge.vertex.position;
        edge = edge.next;
        const v2 = edge.vertex.position;
        edge = edge.next;
        const v3 = edge.vertex.position;
        
        // Calculate two edges
        const edge1 = new THREE.Vector3().subVectors(v2, v1);
        const edge2 = new THREE.Vector3().subVectors(v3, v1);
        
        // Cross product to get normal
        normal.crossVectors(edge1, edge2).normalize();
        
        return normal;
    }
    
    /**
     * Calculates the center point of a face
     */
    calculateFaceCenter(face) {
        const center = new THREE.Vector3();
        let count = 0;
        
        let startEdge = face.edge;
        let currentEdge = startEdge;
        
        do {
            center.add(currentEdge.vertex.position);
            count++;
            currentEdge = currentEdge.next;
        } while (currentEdge !== startEdge);
        
        if (count > 0) {
            center.divideScalar(count);
        }
        
        return center;
    }
    
    /**
     * Collects all vertices of a face in order
     */
    collectFaceVertices(face) {
        const vertices = [];
        
        let startEdge = face.edge;
        let currentEdge = startEdge;
        
        do {
            vertices.push(currentEdge.vertex);
            currentEdge = currentEdge.next;
        } while (currentEdge !== startEdge);
        
        return vertices;
    }
    
    /**
     * Creates a new extruded vertex from an original vertex
     * 
     * @param {Object} heMesh - The half-edge mesh
     * @param {Object} originalVertex - The vertex to extrude from
     * @param {THREE.Vector3} faceCenter - The center of the face being extruded
     * @param {THREE.Vector3} faceNormal - The normal of the face being extruded
     * @param {number} distance - Extrusion distance
     * @param {number} scale - Extrusion scale factor
     * @returns {Object} - The newly created vertex
     */
    createExtrudedVertex(heMesh, originalVertex, faceCenter, faceNormal, distance, scale) {
        // Calculate direction vector for scaling (from center to vertex)
        const directionVector = new THREE.Vector3().subVectors(
            originalVertex.position, 
            faceCenter
        );
        
        // Create new vertex position:
        // 1. Start at face center
        // 2. Add scaled direction vector
        // 3. Add face normal vector multiplied by distance
        const newPosition = new THREE.Vector3()
            .copy(faceCenter)
            .add(directionVector.multiplyScalar(scale))
            .add(faceNormal.clone().multiplyScalar(distance));
        
        // Create the new vertex
        const newVertex = heMesh.createVertex(
            newPosition.x,
            newPosition.y,
            newPosition.z
        );
        
        // Safety check in case vertex position wasn't properly initialized
        if (!newVertex.position) {
            newVertex.position = new THREE.Vector3(
                newPosition.x, 
                newPosition.y, 
                newPosition.z
            );
        }
        
        return newVertex;
    }
    
    /**
     * Creates a quad face between original and extruded vertices
     * 
     * @param {Object} heMesh - The half-edge mesh
     * @param {Object} v1 - First original vertex
     * @param {Object} v2 - Second original vertex
     * @param {Object} v3 - Second extruded vertex
     * @param {Object} v4 - First extruded vertex
     * @returns {Object|null} - The created face or null if creation failed
     */
    createSideFace(heMesh, v1, v2, v3, v4) {
        const newFace = heMesh.createFace([v1, v2, v3, v4]);
        
        if (!newFace) {
            console.error("Failed to create side face");
            return null;
        }
        
        return newFace;
    }
}

export default new MeshOperations();