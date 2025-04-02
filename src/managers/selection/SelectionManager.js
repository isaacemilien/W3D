import * as THREE from 'three';
import Scene from '../../core/Scene';
import Camera from '../../core/Camera';
import TransformManager from './TransformManager';
import ElementPicker from './ElementPicker';
import GeometryUpdater from './GeometryUpdater';
import SceneGraphManager from '../SceneGraphManager';
import UI from '../../ui/ui';
import ExtrusionOperator from './ExtrusionOperator';
import FaceSplitOperator from './FaceSplitOperator';

class SelectionManager {
    constructor() {
        this.selectedObject = null;
        this.selectionMode = 'OBJECT'; // 'OBJECT', 'VERTEX', 'EDGE', 'FACE'
        this.selectedElement = null;   // could be a HEVertex, HEEdge, or HEFace
        this.currentMeshWrapper = null; // Current { object, heMesh, ... } from SceneGraphManager

        // Initialize sub-systems
        this.transformManager = new TransformManager(this);
        this.elementPicker = new ElementPicker(this);
        this.geometryUpdater = new GeometryUpdater();

        // Event Bindings
        this.onPointerDown = this.onPointerDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    initialize() {
        const renderer = document.querySelector('canvas');
        if (renderer) {
            renderer.addEventListener('pointerdown', this.onPointerDown, false);
        }
    }

    onPointerDown(event) {
        event.preventDefault();

        const result = this.elementPicker.pickElement(event, this.selectionMode);

        if (!result) {
            // No intersection, clear selection
            this.clearSelection();
            return;
        }

        const { pickedObject, pickedElement, pivotPosition } = result;

        // Set up the current selection
        this.currentMeshWrapper = SceneGraphManager.objects.get(pickedObject.uuid);
        this.selectedElement = pickedElement;

        // Set up transform controls
        this.transformManager.setupTransformControls(
            this.selectionMode,
            pivotPosition,
            this.currentMeshWrapper?.object
        );

        // Update UI if in object mode
        if (this.selectionMode === 'OBJECT') {
            // UI.updateObjectPropertiesPanel(this.currentMeshWrapper.object);
        }
    }

    clearSelection() {
        this.selectedElement = null;
        this.transformManager.detachControls();
        this.currentMeshWrapper = null;
        this.selectedObject = null;
    }

    setSelectionMode(mode) {
        if (['OBJECT', 'VERTEX', 'EDGE', 'FACE'].includes(mode)) {
            this.selectionMode = mode;
            this.clearSelection();
        }
    }

    // API method for programmatic selection
    selectObject(object) {
        if (!object) return;

        this.currentMeshWrapper = SceneGraphManager.objects.get(object.uuid);
        if (!this.currentMeshWrapper) {
            console.error("Object not found in SceneGraphManager.");
            return;
        }

        // Calculate center position for transform controls
        const pivotPosition = this.elementPicker.calculateObjectCenter(this.currentMeshWrapper);

        // Set up transform controls
        this.transformManager.setupTransformControls('OBJECT', pivotPosition, object);
        // UI.updateObjectPropertiesPanel(object);
    }

    // API method for mesh operations
    performExtrusion(distance = 1.0, scale = 1.0) {
        if (!this.selectedElement || this.selectionMode !== 'FACE' || !this.currentMeshWrapper) {
            console.warn("No face selected for extrusion");
            return;
        }

        const extrusionOperator = new ExtrusionOperator(this.currentMeshWrapper.heMesh);
        const result = extrusionOperator.extrudeFace(this.selectedElement, distance, scale);

        if (result) {
            this.geometryUpdater.refreshMeshGeometry(this.currentMeshWrapper);
            this.clearSelection();
        }
    }

    handleKeyDown(event) {
        // Existing code for extrusion with 'E' key
        if (event.key === 'e' && !event.ctrlKey && !event.altKey) {
            if (this.selectionMode === 'FACE' && this.selectedElement) {
                this.performExtrusion(1.0, 1.0);
            }
        }

        // Face splitting with 'S' key
        if (event.key === 's' && !event.ctrlKey && !event.altKey) {
            if (this.selectionMode === 'FACE' && this.selectedElement) {
                this.performFaceSplit('auto');
            }
        }

        // Face splitting with specific direction using Shift+S for horizontal, Ctrl+S for vertical
        if (event.key === 's' && event.shiftKey && !event.ctrlKey) {
            if (this.selectionMode === 'FACE' && this.selectedElement) {
                this.performFaceSplit('horizontal');
            }
        }

        if (event.key === 's' && !event.shiftKey && event.ctrlKey) {
            if (this.selectionMode === 'FACE' && this.selectedElement) {
                this.performFaceSplit('vertical');
            }
        }
    }

    // Called by TransformManager when transforms change
    handleTransformUpdate(transformMatrix) {
        if (!this.currentMeshWrapper) return;

        switch (this.selectionMode) {
            case 'OBJECT':
                this.geometryUpdater.updateMeshFromTransform(
                    this.currentMeshWrapper,
                    transformMatrix,
                    this.transformManager.getTransformDummy()
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

    // Add these methods to your HEMesh class in src/models/HEMesh.js

    /**
     * Splits a face along its middle, creating two new faces
     * @param {HEFace} face - The face to split
     * @param {string} direction - Direction to split ('horizontal' or 'vertical')
     * @returns {Object} - Object containing the two new faces and new edges
     */
    splitFace(face, direction = 'horizontal') {
        if (!face) {
            console.error("Cannot split: face is null or undefined");
            return null;
        }

        // Get all vertices of the face
        const faceVertices = this.collectVerticesOfFace(face);

        // Need a quad face (4 vertices) to split properly
        if (faceVertices.length !== 4) {
            console.error("Face splitting is only supported for quad faces");
            return null;
        }

        // Determine the pairs of vertices to connect
        // For a quad face with vertices in order [v0, v1, v2, v3]:
        // - Horizontal split connects v0-v2 (creates a line from left to right)
        // - Vertical split connects v1-v3 (creates a line from top to bottom)
        const v0 = faceVertices[0];
        const v1 = faceVertices[1];
        const v2 = faceVertices[2];
        const v3 = faceVertices[3];

        // Determine which vertices to connect based on direction
        let startVertex, endVertex;
        if (direction === 'horizontal') {
            startVertex = v0;
            endVertex = v2;
        } else { // vertical
            startVertex = v1;
            endVertex = v3;
        }

        // Calculate middle points between the vertices
        const midPoint = new THREE.Vector3()
            .addVectors(startVertex.position, endVertex.position)
            .multiplyScalar(0.5);

        // Create a new vertex at the midpoint
        const midVertex = this.createVertex(midPoint.x, midPoint.y, midPoint.z);

        // Remove the original face
        const originalEdges = this.collectEdgesOfFace(face);
        this.removeFace(face);

        // Create new faces based on the direction
        let face1, face2;
        if (direction === 'horizontal') {
            // Split horizontally: v0-v1-midVertex and midVertex-v2-v3
            face1 = this.createFace([v0, v1, midVertex]);
            face2 = this.createFace([midVertex, v2, v3, v0]);
        } else {
            // Split vertically: v0-v1-midVertex and midVertex-v2-v3-v0
            face1 = this.createFace([v0, v1, midVertex, v3]);
            face2 = this.createFace([v1, v2, v3, midVertex]);
        }

        // Reconnect the half-edges with their opposites
        this.findOppositeEdges();

        return {
            faces: [face1, face2],
            newVertex: midVertex
        };
    }

    /**
     * Helper method to collect all vertices of a face in order
     * @param {HEFace} face - The face to collect vertices from
     * @returns {Array} - Array of vertices in order
     */
    collectVerticesOfFace(face) {
        const vertices = [];

        if (!face || !face.edge) {
            return vertices;
        }

        let currentEdge = face.edge;
        const startEdge = currentEdge;

        do {
            // For each half-edge, get the vertex it points to
            vertices.push(currentEdge.vertex);
            currentEdge = currentEdge.next;
        } while (currentEdge !== startEdge);

        return vertices;
    }

    /**
     * Helper method to collect all edges of a face in order
     * @param {HEFace} face - The face to collect edges from
     * @returns {Array} - Array of edges in order
     */
    collectEdgesOfFace(face) {
        const edges = [];

        if (!face || !face.edge) {
            return edges;
        }

        let currentEdge = face.edge;
        const startEdge = currentEdge;

        do {
            edges.push(currentEdge);
            currentEdge = currentEdge.next;
        } while (currentEdge !== startEdge);

        return edges;
    }

    // Add this method to the SelectionManager class in src/managers/selection/SelectionManager.js
    performFaceSplit(direction = 'auto') {
        if (!this.selectedElement || this.selectionMode !== 'FACE' || !this.currentMeshWrapper) {
            console.warn("No face selected for splitting");
            return;
        }

        const faceSplitOperator = new FaceSplitOperator(this.currentMeshWrapper.heMesh);

        // If direction is 'auto', determine the best direction based on face shape
        let splitDirection = direction;
        if (direction === 'auto') {
            splitDirection = faceSplitOperator.determineBestSplitDirection(this.selectedElement);
        }

        const result = faceSplitOperator.splitFace(this.selectedElement, splitDirection);

        if (result) {
            this.geometryUpdater.refreshMeshGeometry(this.currentMeshWrapper);
            this.clearSelection();
        }
    }
}

export default new SelectionManager();