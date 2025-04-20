// src/managers/selection/GeometryUpdater.js
import * as THREE from 'three';
import Scene from '../core/Scene';
import Queries from './Queries';
import { HalfedgeDS } from 'three-mesh-halfedge';
import SceneGraph from './SceneGraph';
import Selector from './Selector';

class Updater {
    constructor() {
    }

    handleTransformUpdate() {
        if (!Selector.currentMeshWrapper) return;

        const transformDummy = Selector.transform.getTransformDummy();
        const meshWrapper = Selector.currentMeshWrapper;
        const object = meshWrapper.object;

        switch (Selector.selectionMode) {
            case 'OBJECT':
                // Apply transformDummy's transformation to the actual mesh object
                object.position.copy(transformDummy.position);
                object.quaternion.copy(transformDummy.quaternion);
                object.scale.copy(transformDummy.scale);

                // Update the mesh's matrices
                object.updateMatrix();
                object.updateMatrixWorld(true);
                
                this.rebuildHalfedgeStructure(meshWrapper);

                console.log("lksdjflksj")
                break;

            case 'VERTEX':
                if (Selector.selectedElement) {
                    this.updateVertexPosition(
                        meshWrapper,
                        Selector.selectedElement,
                        transformDummy.position
                    );
                }
                break;

            case 'EDGE':
                if (Selector.selectedElement) {
                    this.updateEdgePosition(
                        meshWrapper,
                        Selector.selectedElement,
                        transformDummy.position
                    );
                }
                break;

            case 'FACE':
                if (Selector.selectedElement) {
                    this.updateFacePosition(
                        meshWrapper,
                        Selector.selectedElement,
                        transformDummy.position
                    );
                }
                break;
        }
    }

    refreshMeshGeometry(meshWrapper) {
        if (!meshWrapper) return;

        // Update the main mesh geometry from the half-edge structure
        const newGeometry = Queries.halfedgeToGeometry(meshWrapper.heStruct);
        
        // Apply the new geometry to the mesh
        const oldGeometry = meshWrapper.object.geometry;
        meshWrapper.object.geometry = newGeometry;
        
        // Dispose old geometry to prevent memory leaks
        if (oldGeometry && oldGeometry.dispose) {
            oldGeometry.dispose();
        }
    }

    rebuildHalfedgeStructure(meshWrapper) {
        if (!meshWrapper || !meshWrapper.object) return;

        // Get the current object and its geometry
        const object = meshWrapper.object;
        const geometry = object.geometry.clone();
        
        // Apply object's world matrix to geometry
        geometry.applyMatrix4(object.matrixWorld);
        
        // Create a new half-edge structure from the transformed geometry
        const struct = new HalfedgeDS();
        struct.setFromGeometry(geometry, 1e-10);
        
        // Update the mesh wrapper with the new structure
        meshWrapper.heStruct = struct;
        
        // Reset object transforms since they're now baked into the geometry
        // object.position.set(0, 0, 0);
        // object.quaternion.identity();
        // object.scale.set(1, 1, 1);
        // object.updateMatrix();
        
        // Refresh the mesh geometry to match the new halfedge structure
        // this.refreshMeshGeometry(meshWrapper);
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

        let startEdge = face.halfedge;
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

export default Updater;