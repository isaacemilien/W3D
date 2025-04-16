import * as THREE from 'three'
import Scene from './core/Scene';
import Renderer from './core/Renderer';
import Camera from './core/Camera';
import Lighting from './core/Lighting';
// import PrimitiveFactory from './models/PrimitiveFactory';
// import SceneGraphManager from './managers/SceneGraphManager';
import UI from './ui/ui';
// import HEMesh from './models/HEMesh';
// import SelectionManagerHEDS from './managers/SelectionManagerHEDS';
import SceneGraph from './managers/SceneGraph';
import Queries from './managers/Queries';
import { HalfedgeDS } from 'three-mesh-halfedge';
import Factory from './managers/Factory';

// SceneGraphManager.addObject(PrimitiveFactory.createCube());
// SceneGraphManager.addObject(PrimitiveFactory.createSphere());

// Add grid scene, eventually place in seperate class with more advanced grid logic
const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
Scene.addObject(gridHelper);


// const cube = PrimitiveFactory.createCubeHEDS();
// SceneGraphManager.addObject(cube.object, cube.heMesh);

// SelectionManagerHEDS.selectObject(cube.object);


// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshStandardMaterial({ color: 0x6699ff, metalness: 0, roughness: 0.5 });

// const struct = new HalfedgeDS();
// struct.setFromGeometry(geometry, 1e-10);

// const newMesh = Queries.halfedgeToGeometry(struct)

// const mesh = new THREE.Mesh(newMesh, material);
// Scene.addObject(mesh);


// Factory.createCube();

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