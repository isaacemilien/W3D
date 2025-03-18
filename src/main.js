import * as THREE from 'three'
import Scene from './core/Scene';
import Renderer from './core/Renderer';
import Camera from './core/Camera';
import Lighting from './core/Lighting';
import PrimitiveFactory from './models/PrimitiveFactory';
import SelectionManager from './managers/SelectionManager';
import SceneGraphManager from './managers/SceneGraphManager';
import UI from './ui/ui';
import HEMesh from './models/HEMesh';
import SelectionManagerHEDS from './managers/SelectionManagerHEDS';


// SceneGraphManager.addObject(PrimitiveFactory.createCube());
// SceneGraphManager.addObject(PrimitiveFactory.createSphere());

// Add grid scene, eventually place in seperate class with more advanced grid logic
const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
Scene.addObject(gridHelper);


const cube = PrimitiveFactory.createCubeHEDS();
SceneGraphManager.addObject(cube.object, cube.heMesh);
// const cube2 = PrimitiveFactory.createCubeHEDS();
// SceneGraphManager.addObject(cube2.object, cube2.heMesh);

// Create the HEMesh sphere
// // Create the HEMesh sphere
// const myHEMesh2 = new HEMesh();
// myHEMesh2.createBox();
// const boxGeom = myHEMesh2.toBufferGeometry();
// const boxMesh = new THREE.Mesh(boxGeom, material);
// Scene.scene.add(boxMesh);
// SceneGraphManager.addObject(boxMesh, null, myHEMesh2);


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