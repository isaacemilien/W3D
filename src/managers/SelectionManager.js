import * as THREE from 'three';

class SelectionManager {
    constructor(Scene, Renderer, Camera, transformControls, sceneGraphManager) {
        this.Scene = Scene;
        this.Renderer = Renderer;
        this.Camera = Camera;
        this.selectedObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.transformControls = transformControls;
        this.sceneGraphManager = sceneGraphManager;

        this.selectionMode = {
            OBJECT: "object",
            VERTEX: "vertex"
        }

        window.addEventListener('click', (event) => this.onMouseClick(event));
    }

    onMouseClick(event) {
        const rect = this.Renderer.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.Camera.camera);

        const unpackedSceneGraphObjects = Array.from(this.sceneGraphManager.objects.values()).map(value => value.object)
        const intersects = this.raycaster.intersectObjects(unpackedSceneGraphObjects);
        
        if (intersects.length > 0) {
            this.selectedObject = intersects[0].object;

            this.attachTransformControls(this.selectedObject);
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
}

export default SelectionManager;