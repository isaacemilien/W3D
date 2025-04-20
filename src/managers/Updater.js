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

    handleTransformUpdate(currentMatrix, lastMatrix, transformDummy) {
        if (!SceneGraph.currentMeshWrapper) return;

        switch (SceneGraph.selectionMode) {
            case 'OBJECT':
                this.updateMeshFromTransform(
                    Selector.currentMeshWrapper,
                    currentMatrix,
                    lastMatrix
                );
                break;

            case 'VERTEX':
                if (this.selectedElement) {
                    this.geometryUpdater.updateVertexPosition(
                        this.currentMeshWrapper,
                        this.selectedElement,
                        this.transformManager.getTransformDummy().position
                    );
                }
                break;

            case 'EDGE':
                if (this.selectedElement) {
                    this.geometryUpdater.updateEdgePosition(
                        this.currentMeshWrapper,
                        this.selectedElement,
                        this.transformManager.getTransformDummy().position
                    );
                }
                break;

            case 'FACE':
                if (this.selectedElement) {
                    this.geometryUpdater.updateFacePosition(
                        this.currentMeshWrapper,
                        this.selectedElement,
                        this.transformManager.getTransformDummy().position
                    );
                }
                break;
        }
    }

    refreshMeshGeometry(meshWrapper) {
        if (!meshWrapper) return;

        // Update the main mesh geometry from the half-edge mesh
        meshWrapper.object.geometry = Queries.halfedgeToGeometry(meshWrapper);
    }

    rebuildHalfedgeStructure(meshWrapper) {
        if (!meshWrapper || !meshWrapper.object) return;

        // Get the current geometry (which now includes the transformations)
        const geometry = meshWrapper.object.geometry;

        // Create a new half-edge structure from the transformed geometry
        const struct = new HalfedgeDS();
        meshWrapper.heMesh = struct.setFromGeometry(geometry);
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

export default Updater;