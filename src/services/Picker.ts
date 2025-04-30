import * as THREE from 'three';
import SceneGraph from '../services/SceneGraph';
import Camera  from '../core/Camera';
import Renderer from '../core/Renderer';

class Picker {
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();

    public getRaycastHit(event: MouseEvent): THREE.Intersection | null{
        const rect = Renderer.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, Camera.camera);
        const intersects = this.raycaster.intersectObjects(SceneGraph.getUnpackedSceneGraphObjects(), true);

        return intersects.length > 0 ? intersects[0] : null;
    }
}

export default new Picker();