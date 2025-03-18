import * as THREE from 'three';
import Scene from '../core/Scene';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import SceneGraphManager from './SceneGraphManager';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import UI from '../ui/ui';

class SelectionManager {
    constructor() {
        this.selectedObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // this.selectionMode = {
        //     OBJECT: "object",
        //     VERTEX: "vertex"
        // }

        this.transformControls = new TransformControls(Camera.camera, Renderer.renderer.domElement);
        // Temp comment while heds implementation
        // Scene.scene.add(this.transformControls.getHelper());

        // Temp comment while heds implementation
        // window.addEventListener('click', (event) => this.onMouseClick(event));

        // Toggle orbit controls on transform control move
        this.transformControls.addEventListener('dragging-changed', function (event) {
            Camera.controls.enabled = !event.value;
        });



        // Enable snapping only while holding "X", find better location for this later
        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "x") {
                SelectionManager.transformControls.setTranslationSnap(1); // 1-unit translate
                SelectionManager.transformControls.setRotationSnap(THREE.MathUtils.degToRad(15)); // 15-degree rotate
                SelectionManager.transformControls.setScaleSnap(0.1); // 0.1 scale increments
            }
        });
        
        window.addEventListener("keyup", (event) => {
            if (event.key.toLowerCase() === "x") {
                // Disable snapping
                SelectionManager.transformControls.setTranslationSnap(null);
                SelectionManager.transformControls.setRotationSnap(null);
                SelectionManager.transformControls.setScaleSnap(null);
            }
        });
    }

    onMouseClick(event) {
        console.log("I shouldn't be runngin");
        
        const rect = Renderer.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, Camera.camera);

        const unpackedSceneGraphObjects = Array.from(SceneGraphManager.objects.values()).map(value => value.object)
        const intersects = this.raycaster.intersectObjects(unpackedSceneGraphObjects);
        
        if (intersects.length > 0) {
            this.selectedObject = intersects[0].object;

            this.selectObject(this.selectedObject)
            console.log('Selected:', this.selectedObject);
        } else {
            this.detachTransformControls();
            this.selectedObject = null;
        }
    }

    attachTransformControls(object) {
        this.transformControls.attach(object);
    }

    detachTransformControls() {
        this.transformControls.detach();
    }

    selectObject(obj) {
        this.selectedObject = obj;
    
        // Repeat copy paste from raycast code.
        const unpackedSceneGraphObjects = Array.from(SceneGraphManager.objects.values()).map(value => value.object)

        unpackedSceneGraphObjects.forEach((o) => {
            if (o === obj) {
                this.attachTransformControls(o);
                UI.updateObjectPropertiesPanel(o);
                // o.userData.meshReference.material.color.set("yellow");
            } else {
                // Later need clear panel on click away
                // UI.updateObjectPropertiesPanel(null);
                
                // o.userData.meshReference.material.color.set(o.userData.originalColor);
            }
        });
    }
}

export default new SelectionManager();