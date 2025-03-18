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
Scene.scene.add(gridHelper);




const heMesh = new HEMesh();
heMesh.createBox(1);
let geometry = heMesh.toBufferGeometry();
const material = new THREE.MeshStandardMaterial({ color: "red", flatShading: false });
const mesh = new THREE.Mesh(geometry, material);
mesh.userData.vertices = heMesh.vertices;
mesh.userData.edges = heMesh.edges;
mesh.userData.faces = heMesh.faces;

// Scene.scene.add(mesh);

SceneGraphManager.addObject(mesh, null, heMesh);

console.log(SceneGraphManager.getUnpackedSceneGraphMeshes());


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