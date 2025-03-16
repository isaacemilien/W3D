import * as THREE from 'three'
import Scene from './core/Scene';
import Renderer from './core/Renderer';
import Camera from './core/Camera';
import Lighting from './core/Lighting';
import PrimitiveFactory from './models/PrimitiveFactory';
import SceneGraphManager from './managers/SceneGraphManager';
import SelectionManager from './managers/SelectionManager';
import { TransformControls } from 'three/examples/jsm/Addons.js';

const transformControls = new TransformControls(Camera.camera, Renderer.renderer.domElement);
Scene.scene.add(transformControls.getHelper());

SceneGraphManager.addObject(PrimitiveFactory.createCube());
const selectionManager = new SelectionManager(Scene, Renderer, Camera, transformControls, SceneGraphManager);

// Toggle orbit controls on transform control move
transformControls.addEventListener('dragging-changed', function (event) {
    Camera.controls.enabled = !event.value;
});

// Update loop
function animate() {
    requestAnimationFrame(animate);
    Camera.update();
    Renderer.render(Scene.scene, Camera.camera);
}

// Camera aspect ratio
window.addEventListener('resize', () => {
    Camera.camera.aspect = window.innerWidth / window.innerHeight;
    Camera.camera.updateProjectionMatrix();
    Renderer.renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();