// Enhanced Updater.js for handling vertex transformations
import * as THREE from 'three';
import Scene from '../core/Scene';
import Queries from './Queries';
import { HalfedgeDS } from 'three-mesh-halfedge';
import SceneGraph from './SceneGraph';
import Selector from './Selector';
import Transform from './Transform';

class Updater {
    constructor() {
        // Store original vertex positions for transformation
        this.originalVertexPositions = new Map();
    }

    /**
     * Handles updating elements when the transform controls are used
     */
    handleElementTransformUpdate() {
        if (!Selector.currentMeshWrapper || !Selector.selectedElement) return;

        const transformDummy = Transform.getTransformDummy();
        const meshWrapper = Selector.currentMeshWrapper;
        const object = meshWrapper.object;

        // Compute transformation matrix (from the last transform to current)
        const lastMatrix = Transform.getLastMatrix();
        const currentMatrix = transformDummy.matrixWorld.clone();
        
        // Create a matrix to represent what changed from last to current
        const deltaMatrix = new THREE.Matrix4().copy(currentMatrix)
            .multiply(new THREE.Matrix4().copy(lastMatrix).invert());

        switch (Selector.selectionMode) {
            case 'VERTEX':
                this.updateVertexPosition(
                    meshWrapper,
                    Selector.selectedElement,
                    transformDummy.position,
                    deltaMatrix
                );
                break;

            case 'EDGE':
                this.updateEdgePosition(
                    meshWrapper,
                    Selector.selectedElement,
                    transformDummy.position,
                    deltaMatrix
                );
                break;

            case 'FACE':
                this.updateFacePosition(
                    meshWrapper,
                    Selector.selectedElement,
                    transformDummy.position,
                    deltaMatrix
                );
                break;
        }

        // Update the last matrix for next transformation
        Transform.updateLastMatrix();
    }

    /**
     * Updates a vertex position properly accounting for object transformations
     */
    updateVertexPosition(meshWrapper, vertex, newWorldPosition, deltaMatrix) {
        if (!meshWrapper || !vertex) return;
        
        const object = meshWrapper.object;
        
        // Get the correct world-to-local conversion by considering object's world matrix
        const objectWorldInverse = new THREE.Matrix4().copy(object.matrixWorld).invert();
        
        // Convert the world position to local space
        const localPosition = newWorldPosition.clone().applyMatrix4(objectWorldInverse);
        
        // Update the vertex position
        vertex.position.copy(localPosition);
        
        // Refresh the mesh geometry to reflect the changes
        this.refreshMeshGeometry(meshWrapper);
    }

    /**
     * Updates an edge position properly accounting for object transformations
     */
    updateEdgePosition(meshWrapper, edge, newMidpoint, deltaMatrix) {
        if (!meshWrapper || !edge) return;

        const object = meshWrapper.object;
        const objectWorldInverse = new THREE.Matrix4().copy(object.matrixWorld).invert();

        // Get the two vertices of the edge
        const v1 = edge.vertex;
        const v2 = edge.next.vertex;

        // Calculate the current midpoint in world space
        const currentMidpointLocal = new THREE.Vector3()
            .addVectors(v1.position, v2.position)
            .multiplyScalar(0.5);
        
        const currentMidpointWorld = currentMidpointLocal.clone()
            .applyMatrix4(object.matrixWorld);

        // Calculate the offset to move both vertices (in world space)
        const offsetWorld = new THREE.Vector3()
            .subVectors(newMidpoint, currentMidpointWorld);
        
        // Convert the offset to local space
        const offsetLocal = offsetWorld.clone()
            .applyMatrix4(objectWorldInverse)
            .sub(new THREE.Vector3()); // Subtract origin to make it a direction vector
        
        // Apply the offset to both vertices
        v1.position.add(offsetLocal);
        v2.position.add(offsetLocal);

        // Refresh the mesh geometry
        this.refreshMeshGeometry(meshWrapper);
    }

    /**
     * Updates a face position properly accounting for object transformations
     */
    updateFacePosition(meshWrapper, face, newCenter, deltaMatrix) {
        if (!meshWrapper || !face) return;

        const object = meshWrapper.object;
        const objectWorldInverse = new THREE.Matrix4().copy(object.matrixWorld).invert();

        // Calculate the current center of the face in local space
        const currentCenterLocal = new THREE.Vector3();
        let count = 0;

        let startEdge = face.halfedge;
        let currentEdge = startEdge;

        // Collect all vertices of the face
        const vertices = [];

        do {
            currentCenterLocal.add(currentEdge.vertex.position);
            count++;
            vertices.push(currentEdge.vertex);
            currentEdge = currentEdge.next;
        } while (currentEdge !== startEdge);

        if (count > 0) {
            currentCenterLocal.divideScalar(count);
        }
        
        // Convert local center to world space
        const currentCenterWorld = currentCenterLocal.clone()
            .applyMatrix4(object.matrixWorld);

        // Calculate the offset to move all vertices (in world space)
        const offsetWorld = new THREE.Vector3()
            .subVectors(newCenter, currentCenterWorld);
        
        // Convert the offset to local space
        const offsetLocal = offsetWorld.clone()
            .applyMatrix4(objectWorldInverse)
            .sub(new THREE.Vector3()); // Subtract origin to make it a direction vector

        // Apply the offset to all vertices of the face
        vertices.forEach(vertex => {
            vertex.position.add(offsetLocal);
        });

        // Refresh the mesh geometry
        this.refreshMeshGeometry(meshWrapper);
    }

    /**
     * Recreates the mesh geometry based on the updated halfedge structure
     */
    refreshMeshGeometry(meshWrapper) {
        if (!meshWrapper) return;

        // Generate new geometry from the updated half-edge structure
        const newGeometry = Queries.halfedgeToGeometry(meshWrapper.heStruct);

        // Apply the new geometry to the mesh
        const oldGeometry = meshWrapper.object.geometry;
        meshWrapper.object.geometry = newGeometry;

        // Dispose old geometry to prevent memory leaks
        if (oldGeometry && oldGeometry.dispose) {
            oldGeometry.dispose();
        }
    }

    /**
     * Handles object-level transformation updates
     */
    handleTransformUpdate() {
        if (!Selector.currentMeshWrapper) return;

        const transformDummy = Transform.getTransformDummy();
        const meshWrapper = Selector.currentMeshWrapper;
        const object = meshWrapper.object;

        switch (Selector.selectionMode) {
            case 'OBJECT':
                // Apply transformDummy's transformation to the object
                object.position.copy(transformDummy.position);
                object.quaternion.copy(transformDummy.quaternion);
                object.scale.copy(transformDummy.scale);

                // Update matrices
                object.updateMatrix();
                object.updateMatrixWorld(true);

                // Rebuild the halfedge structure after transform
                this.rebuildHalfedgeStructure(meshWrapper);
                break;

            default:
                // For element-level transformations
                this.handleElementTransformUpdate();
                break;
        }
    }

    /**
     * Rebuilds the halfedge structure after object transformation
     */
    rebuildHalfedgeStructure(meshWrapper) {
        if (!meshWrapper || !meshWrapper.object) return;

        // Get the current object and its geometry
        const object = meshWrapper.object;
        
        // Clone the original geometry to avoid modifying it
        const geometry = object.geometry.clone();
        
        // Create a new half-edge structure
        const struct = new HalfedgeDS();
        struct.setFromGeometry(geometry, 1e-10);
        
        // Update the mesh wrapper with the new structure
        meshWrapper.heStruct = struct;
    }
}

export default Updater;