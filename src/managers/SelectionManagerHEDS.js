import * as THREE from 'three';
import Scene from '../core/Scene';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import SceneGraphManager from './SceneGraphManager';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import UI from '../ui/ui';
import HEMesh from '../models/HEMesh';

class SelectionManagerHEDS {
    constructor() {
        this.selectedObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.transformControls = new TransformControls(Camera.camera, Renderer.renderer.domElement);
        Scene.scene.add(this.transformControls.getHelper());


        // Toggle orbit controls on transform control move
        this.transformControls.addEventListener('dragging-changed', function (event) {
            Camera.controls.enabled = !event.value;
            if (!event.value) {
                this.lastPosition = null; // Reset stored position when dragging stops
            }
        });


        this.selectionMode = 'OBJECT'; // or 'EDGE', 'FACE'
        this.selectedElement = null;   // could be a HEVertex, HEEdge, or HEFace

        // A small THREE.Object3D to place our TransformControls at the correct location.
        this.transformDummy = new THREE.Object3D();
        Scene.scene.add(this.transformDummy);


        this.onPointerDown = this.onPointerDown.bind(this);
        Renderer.renderer.domElement.addEventListener('pointerdown', this.onPointerDown, false);

        this.curObj = null;

        // move logic
        this.transformControls.addEventListener('objectChange', () => {
            // console.log("Мовинг транс ", this.curObj.heMesh.vertices[0].position);

            if (this.curObj != null && this.selectionMode == "OBJECT") {
                this.updateHEDSFromTransform();
                console.log("sdfsfsdfsfds");

            }





            if (!this.selectedElement) return;

            if (this.selectionMode === 'VERTEX') {
                // Move that vertex to transformDummy's position
                this.selectedElement.position.copy(this.transformDummy.position);
                this.refreshMeshGeometry();

            } else if (this.selectionMode === 'EDGE') {
                const e = this.selectedElement;
                const pA = e.vertex.position;
                const pB = e.next.vertex.position;
                const midOld = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
                const midNew = this.transformDummy.position;
                const offset = new THREE.Vector3().subVectors(midNew, midOld);
                pA.add(offset);
                pB.add(offset);
                this.refreshMeshGeometry();

            } else if (this.selectionMode === 'FACE') {
                // Move all face vertices. 
                const face = this.selectedElement;
                const newCenter = this.transformDummy.position;
                // Current center:
                const currentCenter = new THREE.Vector3();
                let start = face.edge;
                let curr = start;
                let count = 0;
                do {
                    currentCenter.add(curr.vertex.position);
                    count++;
                    curr = curr.next;
                } while (curr !== start);
                currentCenter.multiplyScalar(1 / count);

                const offset = new THREE.Vector3().subVectors(newCenter, currentCenter);
                // Shift each vertex
                curr = start;
                do {
                    curr.vertex.position.add(offset);
                    curr = curr.next;
                } while (curr !== start);

                this.refreshMeshGeometry();
            }
        });

    }

    // Rebuild geometry from HEMesh and set it on the mesh
    refreshMeshGeometry() {
        // SceneGraphManager.getUnpackedSceneGraphObjects()[0].geometry = SceneGraphManager.getUnpackedSceneGraphMeshes()[0].toBufferGeometry();
        this.curObj.object.geometry = this.curObj.heMesh.toBufferGeometry();
    }


    onPointerDown(event) {
        event.preventDefault();

        console.log("длыловфждывоа");

        // Normalized device coordinates
        const rect = Renderer.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, Camera.camera);
        // We just intersect the main mesh. Then we figure out the nearest sub-element of the HEDS
        const intersects = raycaster.intersectObjects(SceneGraphManager.getUnpackedSceneGraphObjects());
        if (intersects.length === 0) {

            // No intersection, clear selection
            this.selectedElement = null;
            this.transformControls.detach();
            this.curObj = null;
            this.selectedObject = null;

            return;
        }

        // We have an intersection
        const intersect = intersects[0];
        const pickedObj = intersect.object;

        // Grab the wrapper object that contains { object: THREE.Mesh, heMesh: HEMesh }
        this.curObj = SceneGraphManager.objects.get(pickedObj.uuid);


        switch (this.selectionMode) {
            case 'OBJECT':
                console.log("Selecting object...");
                
                // Compute center of object based on HEDS vertices
                const center = new THREE.Vector3();
                let count = 0;
                this.curObj.heMesh.vertices.forEach(vertex => {
                    center.add(vertex.position);
                    count++;
                });
            
                center.divideScalar(count); // Get the average center
                this.transformDummy.position.copy(center); // Move dummy to center
                this.transformControls.attach(this.transformDummy); // Attach TransformControls to the dummy
                break;

            case 'VERTEX':
                // Find nearest vertex in the face hit, do a naive check among all vertices
                this.selectedElement = this.getNearestVertex(intersect.point, this.curObj.heMesh.vertices);
                if (this.selectedElement) {
                    this.transformDummy.position.copy(this.selectedElement.position);
                    this.transformControls.attach(this.transformDummy);
                }
                break;

            case 'EDGE':

                // Find nearest edge among all edges.
                this.selectedElement = this.getNearestEdge(intersect.point, this.curObj.heMesh.edges);
                if (this.selectedElement) {
                    // Position transform at midpoint of that edge
                    const vA = this.selectedElement.vertex.position;
                    const vB = this.selectedElement.next.vertex.position;
                    this.transformDummy.position.copy(new THREE.Vector3().addVectors(vA, vB).multiplyScalar(0.5));
                    this.transformControls.attach(this.transformDummy);
                }
                break;

            case 'FACE':
                // Find face from the intersected triangle  do it by matching face normal or vertex indices
                this.selectedElement = this.getIntersectedFace(intersect, this.curObj.heMesh.faces);
                if (this.selectedElement) {
                    // Place transform at face center
                    const center = new THREE.Vector3();
                    let start = this.selectedElement.edge;
                    let curr = start;
                    let count = 0;
                    do {
                        center.add(curr.vertex.position);
                        curr = curr.next;
                        count++;
                    } while (curr !== start);
                    center.multiplyScalar(1 / count);

                    this.transformDummy.position.copy(center);
                    this.transformControls.attach(this.transformDummy);
                }
                break;
        }


    }

    // For vertex picking
    getNearestVertex(point, curVerts) {
        let minDist = Infinity;
        let closest = null;

        for (let v of curVerts) {
            const dist = v.position.distanceTo(point);
            if (dist < minDist) {
                minDist = dist;
                closest = v;
            }
        }
        return closest;
    }

    // For edge picking
    getNearestEdge(point, curEdges) {
        let minDist = Infinity;
        let closest = null;
        for (let e of curEdges) {
            const pA = e.vertex.position;
            const pB = e.next.vertex.position;
            // Distance from point to segment pA->pB
            const dist = this.pointToSegmentDistance(point, pA, pB);
            if (dist < minDist) {
                minDist = dist;
                closest = e;
            }
        }
        return closest;
    }

    pointToSegmentDistance(pt, pA, pB) {
        const vAB = new THREE.Vector3().subVectors(pB, pA);
        const vAP = new THREE.Vector3().subVectors(pt, pA);
        const t = Math.max(0, Math.min(1, vAP.dot(vAB) / vAB.lengthSq()));
        const proj = new THREE.Vector3().copy(pA).addScaledVector(vAB, t);
        return proj.distanceTo(pt);
    }

    getIntersectedFace(intersect, curFaces) {
        const triIndex = intersect.faceIndex;
        const faceId = Math.floor(triIndex / 2);
        return curFaces[faceId] || null;
    }

    updateHEDSFromTransform() {
        // Compute the difference in transformation
        const currentMatrix = new THREE.Matrix4();
        this.transformDummy.updateMatrixWorld(true);
        currentMatrix.copy(this.transformDummy.matrixWorld);
    
        if (!this.lastMatrix) {
            this.lastMatrix = currentMatrix.clone(); // Store initial transformation
        }
    
        // Compute the delta transformation
        const deltaMatrix = new THREE.Matrix4();
        deltaMatrix.copy(this.lastMatrix).invert().multiply(currentMatrix); // Compute relative transformation
    
        // Apply delta transformation to all HEDS vertices
        this.curObj.heMesh.vertices.forEach(vertex => {
            const v = vertex.position.clone();
            v.applyMatrix4(deltaMatrix); // Apply full transformation (position, rotation, scaling)
            vertex.position.copy(v);
        });
    
        // Store the last transformation for the next update
        this.lastMatrix.copy(currentMatrix);
    
        // Update Three.js mesh geometry to reflect the new HEDS positions
        this.refreshMeshGeometry();
    }
}

export default new SelectionManagerHEDS();