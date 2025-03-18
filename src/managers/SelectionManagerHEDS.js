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
        });


        this.selectionMode = 'EDGE'; // or 'EDGE', 'FACE'
        this.selectedElement = null;   // could be a HEVertex, HEEdge, or HEFace

        // A small THREE.Object3D to place our TransformControls at the correct location.
        this.transformDummy = new THREE.Object3D();
        Scene.scene.add(this.transformDummy);


        this.onPointerDown = this.onPointerDown.bind(this);
        Renderer.renderer.domElement.addEventListener('pointerdown', this.onPointerDown, false);


        // move logic
        this.transformControls.addEventListener('objectChange', () => {
            console.log("раааааннннннииииинг");




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
        SceneGraphManager.getUnpackedSceneGraphObjects()[0].geometry = SceneGraphManager.getUnpackedSceneGraphMeshes()[0].toBufferGeometry();
    }



    onPointerDown(event) {
        event.preventDefault();



        // Normalized device coordinates
        const rect = Renderer.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, Camera.camera);
        // We just intersect the main mesh. Then we figure out the nearest sub-element of the HEDS
        const intersects = raycaster.intersectObject(SceneGraphManager.getUnpackedSceneGraphObjects()[0]);
        if (intersects.length === 0) {

            // No intersection, clear selection
            this.selectedElement = null;
            this.transformControls.detach();
            return;
        }

        // We have the intersection on the mesh
        const intersect = intersects[0];

        console.log("Алё ", this.selectionMode);

        switch (this.selectionMode) {
            case 'VERTEX':


                // Find nearest vertex in the face hit, do a naive check among all vertices
                this.selectedElement = this.getNearestVertex(intersect.point);
                if (this.selectedElement) {
                    this.transformDummy.position.copy(this.selectedElement.position);
                    this.transformControls.attach(this.transformDummy);
                }
                break;

            case 'EDGE':

                // Find nearest edge among all edges.
                this.selectedElement = this.getNearestEdge(intersect.point);
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
                this.selectedElement = this.getIntersectedFace(intersect);
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
    getNearestVertex(point) {
        let minDist = Infinity;
        let closest = null;
        console.log(SceneGraphManager.getUnpackedSceneGraphObjects()[0].userData);

        for (let v of SceneGraphManager.getUnpackedSceneGraphMeshes()[0].vertices) {
            const dist = v.position.distanceTo(point);
            if (dist < minDist) {
                minDist = dist;
                closest = v;
            }
        }
        return closest;
    }

    // For edge picking
    getNearestEdge(point) {
        let minDist = Infinity;
        let closest = null;
        for (let e of SceneGraphManager.getUnpackedSceneGraphMeshes()[0].edges) {
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

    getIntersectedFace(intersect) {
        const triIndex = intersect.faceIndex; 
        const faceId = Math.floor(triIndex / 2);
        return SceneGraphManager.getUnpackedSceneGraphMeshes()[0].faces[faceId] || null;
    }
}

export default new SelectionManagerHEDS();