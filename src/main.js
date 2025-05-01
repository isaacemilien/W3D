/**
 * Project: W3D
 * Description: A web-based 3D modelling application enabling users to work with 3D models in browsers without software installation, featuring primitive creation, transformation tools, and mesh operations using Three.js and half-edge data structures for topology management.
 * 
 * Open Source Licensing Compliance Notice
 * ---------------------------------------
 * This project utilises open-source libraries, and we respectfully acknowledge the creators
 * and maintainers of these projects. Their contributions have enabled the development of this software.
 *
 * Dependencies:
 * 
 * - three.js (https://threejs.org/)
 *   License: MIT License
 *   Copyright © 2010-2025 three.js authors
 *   Source: https://github.com/mrdoob/three.js
 * 
 * - three-mesh-halfedge (https://github.com/gkjohnson/three-mesh-halfedge)
 *   License: MIT License
 *   Copyright © 2019-2025 Geoffrey Johnston
 *   Source: https://github.com/gkjohnson/three-mesh-halfedge
 * 
 * These libraries are licensed under the MIT License, which permits reuse, modification,
 * and distribution with attribution.
 */

import * as THREE from 'three'
import Scene from './core/Scene';
import Renderer from './core/Renderer';
import Camera from './core/Camera';
import Lighting from './core/Lighting';
import UI from './ui/UI';
import SceneGraph from './services/SceneGraph';
import { HalfedgeDS } from 'three-mesh-halfedge';
import Factory from './services/Factory';

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