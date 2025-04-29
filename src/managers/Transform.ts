import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Scene from '../core/Scene';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import { SelectionMode, Wrapper } from './types';
import { Halfedge, Vertex, Face } from 'three-mesh-halfedge';

class Transform {
    public onTransformDelta: (delta: THREE.Matrix4) => void = () => { };
    private control: TransformControls;
    private _attachedObject: THREE.Object3D | null = null; // **points to the pivot**
    private _origMatrix: THREE.Matrix4 | null = null;
    private _wrapper: Wrapper | null = null;
    private _selectionMode: SelectionMode = 'OBJECT';
    public selectedElement: Vertex | Halfedge | Face | null = null;

    private proxy: THREE.Object3D;

    constructor() {
        this.control = new TransformControls(
            Camera.camera,
            Renderer.renderer.domElement,
        );
        Scene.addObject(this.control.getHelper());

        this.proxy = new THREE.Object3D();
        this.proxy.visible = false;

        Scene.addObject(this.proxy);

        this.setupListeners();
    }

    public init(selectionMode: SelectionMode, wrapper: Wrapper | null, pivotPosition: THREE.Vector3Like | null, selectedElement: Vertex | Halfedge | Face | null = null) {
        if (!wrapper) return;
        this.detach();
        this._selectionMode = selectionMode;

        switch (selectionMode) {
            case 'OBJECT':
                this.attach(wrapper.render.mesh, wrapper);
                break;
            default:
                console.log("something other than object mode, must attach proxy")
                // assign proxy pos
                this.proxy.position.copy(pivotPosition as THREE.Vector3);
                this.control.attach(this.proxy)

                this._wrapper = wrapper;
                this.selectedElement = selectedElement;
                break;
        }
    }

    public attach(object: THREE.Object3D, wrapper: Wrapper) {
        let pivot = wrapper.pivot;
        if (!pivot) {
            pivot = new THREE.Object3D();
            Scene.addObject(pivot)
            pivot.name = 'pivot';
            pivot.add(object);
            if (object.parent) object.parent.add(pivot);
            wrapper.pivot = pivot;
        }

        pivot.matrixAutoUpdate = true;

        this._attachedObject = pivot;
        this._wrapper = wrapper;
        this.control.attach(pivot);
        this.control.setSpace('local');
    }

    public detach() {
        this.control.detach();
        this._attachedObject = null;
        this._wrapper = null;
        this._origMatrix = null;
    }

    private setupListeners() {
        this.control.addEventListener('objectChange', () => {
            if (this._selectionMode === "OBJECT") return;
            else if (this._selectionMode === "VERTEX") {
                this.updateVertexPosition(this._wrapper as Wrapper, this.selectedElement as Vertex, this.proxy.position);
            } else if (this._selectionMode === "EDGE") {

                console.log("lksjdflkskjflskjfd");
                this.updateEdgePosition(this._wrapper as Wrapper, this.selectedElement as Halfedge, this.proxy.position);
            }else if (this._selectionMode === "FACE"){
                this.updateFacePosition(this._wrapper as Wrapper, this.selectedElement as Face, this.proxy.position);
            }

            // // Update logical mesh vertex position
            // this.selectedVertex.position.copy(this.proxy.position);

            // // Optional: trigger post-move update (e.g., normals)
            // this.logicalMesh.updateAfterVertexMove?.(this.selectedVertex);

            // // Update the render mesh immediately
            // this.renderMesh.updateVertexPosition(this.selectedVertex);

        });

        this.control.addEventListener('dragging-changed', (event) => {
            if (Camera.controls) Camera.controls.enabled = !event.value;
            if (event.value) this._storeOriginalState();
            else this._applyFinalTransform();
        });
    }

    private _storeOriginalState() {
        if (!this._attachedObject) return;
        this._attachedObject.updateMatrix();
        this._origMatrix = this._attachedObject.matrix.clone();
    }

    /** Finish a drag */
    private _applyFinalTransform() {
        if (!this._attachedObject || !this._wrapper || !this._origMatrix) return;

        /* Always make matrices current */
        this._attachedObject.updateMatrixWorld(true);

        /* Δ = M_orig⁻¹ · M_current  (world-space delta) */
        const delta = new THREE.Matrix4().multiplyMatrices(
            this._origMatrix.clone().invert(),
            this._attachedObject.matrix,
        );
        const deltaNoT = delta.clone().setPosition(0, 0, 0);

        /* ------------------------------------------------------------
           OBJECT mode  →  keep rotation / scale on the pivot
                           (do NOT bake, do NOT zero)                 */
        if (this._selectionMode === 'OBJECT') {
            /* logical vertices stay where they are;
               only the transform node moved, so just
               recompute bounds for ray-casting       */
            const geom = this._wrapper.render.mesh.geometry;
            geom.computeBoundingSphere();
            geom.computeBoundingBox();
        }

        /* ------------------------------------------------------------
           VERTEX / EDGE / FACE  →  bake R+S into vertices,
                                    then clear rotation & scale        */
        else {
            this.onTransformDelta(deltaNoT);                 // bake

            /* keep translation, drop R & S so there is no double-transform */
            const finalWorldPos = new THREE.Vector3();
            this._attachedObject.getWorldPosition(finalWorldPos);

            this._attachedObject.rotation.set(0, 0, 0);
            this._attachedObject.scale.set(1, 1, 1);
            this._attachedObject.updateMatrixWorld(true);

            if (this._attachedObject.parent) {
                this._attachedObject.parent.worldToLocal(finalWorldPos);
            }
            this._attachedObject.position.copy(finalWorldPos);
            this._attachedObject.updateMatrixWorld(true);
        }

        /* Refresh gizmo */
        this.control.detach();
        this.control.attach(this._attachedObject);
        this.control.setSpace('local');

        this._origMatrix = null;
    }


    public setMode(mode: 'translate' | 'rotate' | 'scale') {
        this.control.setMode(mode);
    }



    /**
     * Updates a vertex position properly accounting for object transformations
     */
    private updateVertexPosition(wrapper: Wrapper, vertex: Vertex, newWorldPosition: THREE.Vector3) {
        if (!wrapper || !vertex) return;

        console.log("lkskdjf;sjf;lkdjf;slkjf");

        const object = wrapper.render.mesh;

        // Get the correct world-to-local conversion by considering object's world matrix
        const objectWorldInverse = new THREE.Matrix4().copy(object.matrixWorld).invert();

        // Convert the world position to local space
        const localPosition = newWorldPosition.clone().applyMatrix4(objectWorldInverse);

        // Update the vertex position
        vertex.position.copy(localPosition);

        // Refresh the mesh geometry to reflect the changes
        wrapper.render.updateFrom(wrapper.logical);
    }



    /**
     * Updates an edge position properly accounting for object transformations
     */
    private updateEdgePosition(wrapper: Wrapper, edge: Halfedge, newMidpoint: THREE.Vector3) {
        if (!wrapper || !edge) return;

        const object = wrapper.render.mesh;

        // Get the two vertices of the edge
        const v1 = edge.vertex;
        const v2 = edge.twin.vertex;

        // Calculate the current midpoint in local space
        const currentMidpointLocal = new THREE.Vector3()
            .addVectors(v1.position, v2.position)
            .multiplyScalar(0.5);

        // Convert to world space for comparison
        const currentMidpointWorld = currentMidpointLocal.clone()
            .applyMatrix4(object.matrixWorld);

        const v1w = object.localToWorld(v1.position.clone());
        const v2w = object.localToWorld(v2.position.clone());
        const deltaW = new THREE.Vector3().subVectors(newMidpoint, currentMidpointWorld);
        v1.position.copy(object.worldToLocal(v1w.add(deltaW)));
        v2.position.copy(object.worldToLocal(v2w.add(deltaW)));

        // Refresh the mesh geometry
        wrapper.render.updateFrom(wrapper.logical);
    }

    updateFacePosition(wrapper: Wrapper, face: Face, newCenter: THREE.Vector3) {
        if (!wrapper || !face) return;


        const object = wrapper.render.mesh;

        const objectWorldInverse = new THREE.Matrix4().copy(object.matrixWorld).invert();

        // Calculate the current center of the face in local space
        const currentCenterLocal = new THREE.Vector3();
        let count = 0;

        let startEdge = face.halfedge;
        let currentEdge = startEdge;

        // Collect all vertices of the face
        const vertices = [];

        do {
            currentCenterLocal.add(currentEdge.vertex.position);
            count++;
            vertices.push(currentEdge.vertex);
            currentEdge = currentEdge.next;
        } while (currentEdge !== startEdge);

        if (count > 0) {
            currentCenterLocal.divideScalar(count);
        }

        // Convert local center to world space
        const currentCenterWorld = currentCenterLocal.clone()
            .applyMatrix4(object.matrixWorld);

        // Calculate the offset to move all vertices (in world space)
        const offsetWorld = new THREE.Vector3()
            .subVectors(newCenter, currentCenterWorld);

        // Convert the offset to local space
        const offsetLocal = offsetWorld.clone()
            .applyMatrix4(objectWorldInverse)
            .sub(new THREE.Vector3()); // Subtract origin to make it a direction vector

        // Apply the offset to all vertices of the face
        vertices.forEach(vertex => {
            vertex.position.add(offsetLocal);
        });

        // Refresh the mesh geometry
        wrapper.render.updateFrom(wrapper.logical);
    }
}

export function applyDelta(
    delta: THREE.Matrix4,
    selectionMode: SelectionMode,
    wrapper: Wrapper,
    selectedElement: Vertex | Halfedge | Face | null,
) {
    if (!wrapper) return;

    switch (selectionMode) {
        case 'OBJECT':
            for (const vertex of wrapper.logical.struct.vertices) {
                vertex.position.applyMatrix4(delta);
            }
            break;
        /* VERTEX / EDGE / FACE cases here */
    }

    wrapper.render.updateFrom(wrapper.logical);
    const geometry = wrapper.render.mesh.geometry;
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
}

export default new Transform();