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

    constructor() {
        this.control = new TransformControls(
            Camera.camera,
            Renderer.renderer.domElement,
        );
        Scene.addObject(this.control.getHelper());

        this.control.addEventListener('dragging-changed', (event) => {
            if (Camera.controls) Camera.controls.enabled = !event.value;
            if (event.value) this._storeOriginalState();
            else this._applyFinalTransform();
        });
    }

    public init(selectionMode: SelectionMode, wrapper: Wrapper | null) {
        if (!wrapper) return;
        this.detach();
        this._selectionMode = selectionMode;  

        switch (selectionMode) {
            case 'OBJECT':
                this.attach(wrapper.render.mesh, wrapper);
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