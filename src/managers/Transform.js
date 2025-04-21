import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Scene from '../core/Scene';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import Updater from './Updater';
import SceneGraph from './SceneGraph';
import Selector from './Selector';

class Transform {
    constructor() {
        this.lastMatrix = new THREE.Matrix4().identity();
        this.updater = new Updater();
        this.isUsingDummy = false;

        // A small THREE.Object3D to place TransformControls at the correct location
        this.transformDummy = new THREE.Object3D();
        Scene.scene.add(this.transformDummy);

        // Initialize transform controls
        this.transformControls = new TransformControls(Camera.camera, Renderer.renderer.domElement);
        Scene.scene.add(this.transformControls.getHelper());

        // Set default mode
        this.transformControls.setMode('translate');

        this.transformControls.addEventListener('dragging-changed', (event) => {
            // Inform your orbit controls to enable/disable
            if (Camera.controls) {
                Camera.controls.enabled = !event.value;
            }
            
            if (!event.value) {  // Transformation ended
                if (!this.isUsingDummy) {
                    // Object mode: only rebuild HEDS once at the end
                    this.updater.rebuildHalfedgeStructure(Selector.currentMeshWrapper);
                } else {
                    // Element mode: final update for element transformation
                    this.updater.handleElementTransformUpdate();
                }
            }
        });

        // Handle transform changes during dragging
        this.transformControls.addEventListener('objectChange', () => {
            if (this.isUsingDummy) {
                // Update the transformDummy matrix before updating elements
                this.transformDummy.updateMatrixWorld(true);
                
                // Update elements during dragging for vertex/edge/face modes
                this.updater.handleElementTransformUpdate();
            }
        });
    }

    setupTransformControls(selectionMode, object, elementPosition) {
        // Detach controls first
        this.transformControls.detach();

        if (selectionMode === 'OBJECT' && object) {
            // Direct attachment for object mode
            this.transformControls.attach(object);
            this.isUsingDummy = false;
            
            // Update object matrices to ensure correct transformation
            object.updateMatrixWorld(true);
        }
        else if (elementPosition) {
            // Ensure the dummy is at scene root level to avoid inheritance issues
            if (this.transformDummy.parent !== Scene.scene) {
                Scene.scene.add(this.transformDummy);
            }
            
            // Reset the dummy's rotation and scale before positioning
            this.transformDummy.rotation.set(0, 0, 0);
            this.transformDummy.scale.set(1, 1, 1);
            this.transformDummy.position.copy(elementPosition);
            
            // Update dummy matrix
            this.transformDummy.updateMatrixWorld(true);
            
            // Store the initial state for delta calculations
            this.updateLastMatrix();
            
            this.transformControls.attach(this.transformDummy);
            this.isUsingDummy = true;
        }
    }

    detachControls() {
        this.transformControls.detach();
    }

    setTransformMode(mode) {
        if (['translate', 'rotate', 'scale'].includes(mode)) {
            this.transformControls.setMode(mode);
        }
    }

    getTransformDummy() {
        return this.transformDummy;
    }

    getLastMatrix() {
        return this.lastMatrix;
    }

    updateLastMatrix() {
        this.transformDummy.updateMatrixWorld(true);
        this.lastMatrix = new THREE.Matrix4().copy(this.transformDummy.matrixWorld);
    }
}

export default new Transform();