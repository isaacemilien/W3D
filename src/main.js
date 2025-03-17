import * as THREE from 'three'
import Scene from './core/Scene';
import Renderer from './core/Renderer';
import Camera from './core/Camera';
import Lighting from './core/Lighting';
import PrimitiveFactory from './models/PrimitiveFactory';
import SelectionManager from './managers/SelectionManager';
import SceneGraphManager from './managers/SceneGraphManager';

SceneGraphManager.addObject(PrimitiveFactory.createCube());
SceneGraphManager.addObject(PrimitiveFactory.createSphere());

// Temp add object definition, move later
document.getElementById("add-cube").addEventListener("click", () => {
    SceneGraphManager.addObject(PrimitiveFactory.createCube());
});

document.getElementById("add-sphere").addEventListener("click", () => {
    SceneGraphManager.addObject(PrimitiveFactory.createSphere());
});

document.getElementById("move").addEventListener("click", () => {
    SelectionManager.transformControls.setMode("translate")
});

document.getElementById("rot").addEventListener("click", () => {
    SelectionManager.transformControls.setMode("rotate")
});

document.getElementById("scale").addEventListener("click", () => {
    SelectionManager.transformControls.setMode("scale")
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