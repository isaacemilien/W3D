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
                    console.log("довладылоав", SceneGraph.getObjectById(Selector.currentMeshWrapper.object.uuid))
                } else {
                    // Element mode: final update for element transformation
                    this.updater.handleElementTransformUpdate();
                }
            }
        });
        


        // Handle transform changes during dragging
        this.transformControls.addEventListener('objectChange', () => {
            if (this.isUsingDummy) {
                // Only update elements during dragging if using the dummy
                this.updater.handleElementTransformUpdate();
            }
            // For direct object control, no need to do anything during dragging
        });
    }

    // In Transform.js
    setupTransformControls(selectionMode, object, elementPosition = null) {
        // Detach controls first
        this.transformControls.detach();

        if (selectionMode === 'OBJECT' && object) {
            // Direct attachment for object mode
            this.transformControls.attach(object);
            this.isUsingDummy = false;
        }

        else if (elementPosition) {
            // Use transform dummy for element modes
            this.transformDummy.position.copy(elementPosition);
            this.transformDummy.quaternion.identity();
            this.transformDummy.scale.set(1, 1, 1);
            this.transformDummy.updateMatrixWorld(true);

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