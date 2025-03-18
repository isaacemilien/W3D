import * as THREE from 'three'
import Scene from './core/Scene';
import Renderer from './core/Renderer';
import Camera from './core/Camera';
import Lighting from './core/Lighting';
import PrimitiveFactory from './models/PrimitiveFactory';
import SelectionManager from './managers/SelectionManager';
import SceneGraphManager from './managers/SceneGraphManager';
import UI from './ui/ui';

SceneGraphManager.addObject(PrimitiveFactory.createCube());
SceneGraphManager.addObject(PrimitiveFactory.createSphere());

UI.updateObjectPropertiesPanel(null);

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