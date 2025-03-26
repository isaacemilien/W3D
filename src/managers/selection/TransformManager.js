import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Scene from '../../core/Scene';
import Camera from '../../core/Camera';
import Renderer from '../../core/Renderer';

class TransformManager {
    constructor(selectionManager) {
        this.selectionManager = selectionManager;
        this.lastMatrix = new THREE.Matrix4().identity();
        
        // A small THREE.Object3D to place TransformControls at the correct location
        this.transformDummy = new THREE.Object3D();
        Scene.scene.add(this.transformDummy);
        
        // Initialize transform controls
        this.transformControls = new TransformControls(Camera.camera, Renderer.renderer.domElement);
        Scene.scene.add(this.transformControls.getHelper());
        
        // Toggle orbit controls when dragging with transform controls
        this.transformControls.addEventListener('dragging-changed', (event) => {
            Camera.controls.enabled = !event.value;
            if (!event.value) {
                this.lastMatrix = null; // Reset stored position when dragging stops
            }
        });
        
        // Handle transform changes
        this.transformControls.addEventListener('objectChange', () => {
            this.selectionManager.handleTransformUpdate(this.lastMatrix);
        });
    }
    
    setupTransformControls(selectionMode, position, object = null) {
        // Reset transformDummy transformations
        this.transformDummy.position.set(0, 0, 0);
        this.transformDummy.quaternion.identity();
        this.transformDummy.scale.set(1, 1, 1);
        this.transformDummy.matrix.identity();
        
        if (position) {
            this.transformDummy.position.copy(position);
        }
        
        // Only apply rotation and scale in OBJECT mode
        if (selectionMode === 'OBJECT' && object) {
            this.transformDummy.quaternion.copy(object.quaternion);
            this.transformDummy.scale.copy(object.scale);
        }
        
        this.transformDummy.updateMatrixWorld(true);
        
        // Reset lastMatrix
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

export default TransformManager;