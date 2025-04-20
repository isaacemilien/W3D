import * as THREE from 'three'
import Scene from './core/Scene';
import Renderer from './core/Renderer';
import Camera from './core/Camera';
import Lighting from './core/Lighting';
import UI from './managers/UI';
import SceneGraph from './managers/SceneGraph';
import { HalfedgeDS } from 'three-mesh-halfedge';
import Factory from './managers/Factory';
import Selector from './managers/Selector';


import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// Add grid to scene
const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
Scene.addObject(gridHelper);

// Create initial cube
Factory.createCube();

// Set up event listeners for selection
function onPointerDown(event) {
    event.preventDefault();
    Selector.getElementAtMousePosition(event, Selector.selectionMode);
}

document.querySelector('canvas').addEventListener('pointerdown', onPointerDown, false);

// Set up transform control mode listeners
document.getElementById("move").addEventListener("click", () => {
    Selector.transform.setTransformMode("translate");
});

document.getElementById("rot").addEventListener("click", () => {
    Selector.transform.setTransformMode("rotate");
});

document.getElementById("scale").addEventListener("click", () => {
    Selector.transform.setTransformMode("scale");
});

// Auto-select the first object in the scene
// const autoSelectFirstObject = () => {
//     const objects = SceneGraph.getUnpackedSceneGraphObjects();
//     if (objects.length > 0) {
//         Selector.selectObject(objects[0]);
//     }
// };

// Run auto-select after a short delay to ensure objects are loaded
// setTimeout(autoSelectFirstObject, 100);




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