import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Scene from '../core/Scene';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import Updater from './Updater';
import SceneGraph from './SceneGraph';
import Selector from './Selector';

class Transform {
    constructor(selectionManager) {
        this.selectionManager = selectionManager;
        this.lastMatrix = new THREE.Matrix4().identity();
        this.updater = new Updater();

        // A small THREE.Object3D to place TransformControls at the correct location
        this.transformDummy = new THREE.Object3D();
        Scene.scene.add(this.transformDummy);

        // Initialize transform controls
        this.transformControls = new TransformControls(Camera.camera, Renderer.renderer.domElement);
        Scene.scene.add(this.transformControls.getHelper());

        this.transformControls.addEventListener('dragging-changed', (event) => {
            if (!event.value) {
              // Reattach to sync position after move ends
              const object = this.transformControls.object;
              if (object) {
                object.updateMatrixWorld();
                this.transformControls.detach();
                this.transformControls.attach(object);
              }
            }
          });
          
        // Handle transform changes
        this.transformControls.addEventListener('objectChange', this.onControlsChange.bind(this));

        // Add an updater instance directly
    }

    onControlsChange() {
        if (!this.transformControls.object || !SceneGraph.currentMeshWrapper) return;

        // Get the current mesh object
        const meshObject = Selector.currentMeshWrapper.object;

        // Apply transformDummy's transformation to the actual mesh object
        meshObject.position.copy(this.transformDummy.position);
        meshObject.quaternion.copy(this.transformDummy.quaternion);
        meshObject.scale.copy(this.transformDummy.scale);

        // Update the mesh's matrices
        meshObject.updateMatrix();
        meshObject.updateMatrixWorld(true);

        // Now rebuild the half-edge structure from the transformed geometry
        this.updater.rebuildHalfedgeStructure(SceneGraph.currentMeshWrapper);

        // Update lastMatrix
        this.updateLastMatrix();
    }

    // In Transform.js
    setupTransformControls(selectionMode, position, object = null) {
        // Reset transformDummy transformations
        this.transformDummy.position.set(0, 0, 0);
        this.transformDummy.quaternion.identity();
        this.transformDummy.scale.set(1, 1, 1);
        this.transformDummy.matrix.identity();

        if (selectionMode === 'OBJECT' && object) {
            // Get the center of the object
            if (object.geometry) {
                // Ensure geometry bounding box is computed
                if (!object.geometry.boundingBox) {
                    object.geometry.computeBoundingBox();
                }

                // Get the center of the bounding box
                const center = new THREE.Vector3();
                object.geometry.boundingBox.getCenter(center);

                // Transform the center from local space to world space
                center.applyMatrix4(object.matrixWorld);

                // Position the transform dummy at the object's center
                this.transformDummy.position.copy(center);
            } else {
                // If no geometry, use object's world position
                object.getWorldPosition(this.transformDummy.position);
            }

            // Copy object's rotation and scale
            this.transformDummy.quaternion.copy(object.quaternion);
            this.transformDummy.scale.copy(object.scale);
        } else if (position) {
            // For vertex/edge/face selection modes with a specific position
            this.transformDummy.position.copy(position);
        }

        this.transformDummy.updateMatrixWorld(true);
        this.lastMatrix = new THREE.Matrix4().copy(this.transformDummy.matrixWorld);

        // Attach transform controls to dummy
        this.transformControls.attach(this.transformDummy);
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

export default Transform;