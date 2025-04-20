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
import Selector from './managers/Selector';
import { extrudeFace } from './managers/Operations';
import Transform from './managers/Transform';
import Updater from './managers/Updater';
// import Selector from './managers/Selector';


// Add grid scene, eventually place in seperate class with more advanced grid logic
const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
Scene.addObject(gridHelper);

Factory.createCube();

const transform = new Transform()

const updater = new Updater(transform)

function onPointerDown(event) {
    event.preventDefault();

    // console.log(Selector.getElementAtMousePosition(event, "OBJECT"));

    const result = Selector.getElementAtMousePosition(event, "OBJECT");
    
    const { pickedObject, pickedElement, pivotPosition } = result;

    // Set up transform controls
    transform.setupTransformControls(
        "OBJECT",
        pivotPosition,
        pickedObject
    );
}


document.querySelector('canvas').addEventListener('pointerdown', onPointerDown, false);



const obj = SceneGraph.getUnpackedSceneGraphObjects()[0];
const meshWrapper = SceneGraph.getObjectById(obj.uuid); 
console.log("дылволаыдлвао", meshWrapper)

const struct = meshWrapper.heStruct;


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