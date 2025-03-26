import * as THREE from 'three';
import Scene from '../../core/Scene';
import Camera from '../../core/Camera';
import TransformManager from './TransformManager';
import ElementPicker from './ElementPicker';
import GeometryUpdater from './GeometryUpdater';
import SceneGraphManager from '../SceneGraphManager';
import UI from '../../ui/ui';
import ExtrusionOperator from './ExtrusionOperator';

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
            UI.updateObjectPropertiesPanel(this.currentMeshWrapper.object);
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
        UI.updateObjectPropertiesPanel(object);
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
        // Handle extrusion with 'E' key
        if (event.key === 'e' && !event.ctrlKey && !event.altKey) {
            if (this.selectionMode === 'FACE' && this.selectedElement) {
                this.performExtrusion(1.0, 1.0);
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
}

export default new SelectionManager();