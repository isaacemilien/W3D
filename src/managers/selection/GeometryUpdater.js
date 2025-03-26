// src/managers/selection/GeometryUpdater.js
import * as THREE from 'three';
import Scene from '../../core/Scene';

class GeometryUpdater {
    constructor() {}
    
    refreshMeshGeometry(meshWrapper) {
        if (!meshWrapper) return;
        
        // Update the main mesh geometry from the half-edge mesh
        meshWrapper.object.geometry = meshWrapper.heMesh.toBufferGeometry();
        
        // Remove the old wireframe if it exists
        if (meshWrapper.edgeWireframe) {
            Scene.removeObject(meshWrapper.edgeWireframe);
        }
        
        // Create a new wireframe
        const newWireframe = meshWrapper.heMesh.createEdgeWireframe();
        
        // Add to scene
        Scene.addObject(newWireframe);
        
        // Update wireframe reference
        meshWrapper.edgeWireframe = newWireframe;
        
        // Update wireframe transform to match object
        if (meshWrapper.linkWireframeToObject) {
            meshWrapper.linkWireframeToObject();
        }
    }
    
    updateMeshFromTransform(meshWrapper, lastMatrix, transformDummy) {
        if (!meshWrapper || !transformDummy) return;
        
        // Ensure the transform dummy's matrix is up to date
        transformDummy.updateMatrixWorld(true);
        
        // Get the current world matrix of the transform dummy
        const currentMatrix = new THREE.Matrix4().copy(transformDummy.matrixWorld);
        
        // If there's no last matrix, create one
        if (!lastMatrix) {
            lastMatrix = currentMatrix.clone();
        }
        
        // Calculate the delta transformation matrix (what changed since last update)
        const deltaMatrix = new THREE.Matrix4()
            .copy(lastMatrix)
            .invert()
            .multiply(currentMatrix);
        
        // Extract transformation components
        const deltaPosition = new THREE.Vector3();
        const deltaQuaternion = new THREE.Quaternion();
        const deltaScale = new THREE.Vector3();
        deltaMatrix.decompose(deltaPosition, deltaQuaternion, deltaScale);
        
        // Get the world center of the object (pivot point)
        const centerWorld = new THREE.Vector3();
        transformDummy.getWorldPosition(centerWorld);
        
        // Apply transformations to all vertices in the half-edge mesh
        meshWrapper.heMesh.vertices.forEach(vertex => {
            const worldPos = vertex.position.clone();
            
            // Convert vertex to world space
            meshWrapper.object.localToWorld(worldPos);
            
            // Apply transformation relative to pivot:
            // 1. Translate to origin (relative to pivot)
            worldPos.sub(centerWorld);
            
            // 2. Apply rotation
            worldPos.applyQuaternion(deltaQuaternion);
            
            // 3. Apply scale
            worldPos.multiply(deltaScale);
            
            // 4. Translate back to pivot position
            worldPos.add(centerWorld);
            
            // 5. Apply translation
            worldPos.add(deltaPosition);
            
            // Convert back to local space
            meshWrapper.object.worldToLocal(worldPos);
            
            // Update the vertex position
            vertex.position.copy(worldPos);
        });
        
        // Update the mesh geometry
        this.refreshMeshGeometry(meshWrapper);
        
        // Store the current matrix for the next update
        lastMatrix.copy(currentMatrix);
    }
    
    updateVertexPosition(meshWrapper, vertex, newPosition) {
        if (!meshWrapper || !vertex) return;
        
        // Update the vertex position
        vertex.position.copy(newPosition);
        
        // Refresh the mesh geometry
        this.refreshMeshGeometry(meshWrapper);
    }
    
    updateEdgePosition(meshWrapper, edge, newMidpoint) {
        if (!meshWrapper || !edge) return;
        
        // Get the two vertices of the edge
        const v1 = edge.vertex;
        const v2 = edge.next.vertex;
        
        // Calculate the current midpoint
        const currentMidpoint = new THREE.Vector3()
            .addVectors(v1.position, v2.position)
            .multiplyScalar(0.5);
        
        // Calculate the offset to move both vertices
        const offset = new THREE.Vector3()
            .subVectors(newMidpoint, currentMidpoint);
        
        // Apply the offset to both vertices
        v1.position.add(offset);
        v2.position.add(offset);
        
        // Refresh the mesh geometry
        this.refreshMeshGeometry(meshWrapper);
    }
    
    updateFacePosition(meshWrapper, face, newCenter) {
        if (!meshWrapper || !face) return;
        
        // Calculate the current center of the face
        const currentCenter = new THREE.Vector3();
        let count = 0;
        
        let startEdge = face.edge;
        let currentEdge = startEdge;
        
        // Collect all vertices of the face
        const vertices = [];
        
        do {
            currentCenter.add(currentEdge.vertex.position);
            count++;
            vertices.push(currentEdge.vertex);
            currentEdge = currentEdge.next;
        } while (currentEdge !== startEdge);
        
        if (count > 0) {
            currentCenter.divideScalar(count);
        }
        
        // Calculate the offset to move all vertices
        const offset = new THREE.Vector3()
            .subVectors(newCenter, currentCenter);
        
        // Apply the offset to all vertices of the face
        vertices.forEach(vertex => {
            vertex.position.add(offset);
        });
        
        // Refresh the mesh geometry
        this.refreshMeshGeometry(meshWrapper);
    }
}

export default GeometryUpdater;