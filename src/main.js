import * as THREE from 'three'
import Scene from './core/Scene';
import Renderer from './core/Renderer';
import Camera from './core/Camera';
import Lighting from './core/Lighting';
import UI from './ui/UI';
import SceneGraph from './services/SceneGraph';
import { HalfedgeDS } from 'three-mesh-halfedge';
import Factory from './services/Factory';
// import Selector from './managers/Selector';

import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Queries from './services/Queries';
import InputManager from './managers/InputManager';


Lighting.addToScene(Scene.getScene());

// Add grid to scene
const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
Scene.addObject(gridHelper);

// Create initial cube
SceneGraph.addObject(Factory.createCube());


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