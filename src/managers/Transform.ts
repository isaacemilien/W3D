import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Scene from '../core/Scene';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import { SelectionMode, Wrapper, PickResult } from './types';
import { Halfedge, Vertex, Face } from 'three-mesh-halfedge';

class Transform {
    public onTransformDelta: (delta: THREE.Matrix4) => void = () => { };
    private control: TransformControls;
    private _attachedObject: THREE.Object3D | null = null;
    private _origMatrix: THREE.Matrix4 | null = null;
    private _wrapper: Wrapper | null = null;

    constructor() {
        this.control = new TransformControls(Camera.camera, Renderer.renderer.domElement);
        Scene.addObject(this.control.getHelper());

        // Set up the dragging-changed event handler
        this.control.addEventListener('dragging-changed', (event) => {
            // Enable/disable orbit controls during dragging
            if (Camera.controls) {
                Camera.controls.enabled = !event.value;
            }

            if (event.value) {
                // Started dragging - store original state
                this._storeOriginalState();
            } else if (this._attachedObject && this._wrapper) {
                console.log("Transformation complete")
                // Finished dragging - apply the final transformation
                this._applyFinalTransform();
            }
        });
    }

    /**
     * Store the original state before transformation starts
     */
    private _storeOriginalState() {
        if (!this._attachedObject) return;

        // Make sure matrices are up to date
        this._attachedObject.updateMatrix();

        // Store a copy of the original matrix
        this._origMatrix = this._attachedObject.matrix.clone();

        console.log("Original matrix stored");
    }

    /**
     * Apply the final transformation to the logical mesh and rebuild
     */
    private _applyFinalTransform() {
        if (!this._attachedObject || !this._wrapper || !this._origMatrix) return;

        /* ------------------------------------------------------------------
           1.  Matrices *before* we touch anything
        ------------------------------------------------------------------ */
        this._attachedObject.updateMatrixWorld(true);
        const finalWorldPos = new THREE.Vector3();
        this._attachedObject.getWorldPosition(finalWorldPos);   // where the user dropped it

        const delta = new THREE.Matrix4()
            .multiplyMatrices(
                this._origMatrix.clone().invert(),   //  M_orig⁻¹
                this._attachedObject.matrix          //· M_current
            );

        const deltaNoT = delta.clone().setPosition(0, 0, 0);   // strip translation
        this.onTransformDelta(deltaNoT);                       // update logical mesh

        this._attachedObject.position.set(0, 0, 0);
        this._attachedObject.rotation.set(0, 0, 0);
        this._attachedObject.scale.set(1, 1, 1);
        this._attachedObject.updateMatrixWorld(true);

        if (this._attachedObject.parent) {
            this._attachedObject.parent.worldToLocal(finalWorldPos);
        }
        this._attachedObject.position.copy(finalWorldPos);
        this._attachedObject.updateMatrixWorld(true);          // gizmo sees it

        this.control.detach();
        this.control.attach(this._attachedObject);

        this._origMatrix = null;   // ready for the next drag
    }

    /**
     * Attach the controls to a mesh/object to be transformed
     */
    public attach(object: THREE.Object3D, wrapper: Wrapper) {
        // Store references
        this._attachedObject = object;
        this._wrapper = wrapper;

        // Enable matrix auto-updates for smooth dragging
        object.matrixAutoUpdate = true;

        // Attach the transform controls to the object
        this.control.attach(object);
    }

    /**
     * Detach controls from any object
     */
    public detach() {
        if (this.control) {
            this.control.detach();
        }
        this._attachedObject = null;
        this._wrapper = null;
        this._origMatrix = null;
    }

    /**
     * Expose mode switch (translate/rotate/scale)
     */
    public setMode(mode: 'translate' | 'rotate' | 'scale') {
        this.control.setMode(mode);
    }

    /**
     * Initialize transform controls based on selection mode and object
     */
    public init(selectionMode: SelectionMode, wrapper: Wrapper | null): void {
        this.detach();

        if (!wrapper) return;

        if (selectionMode === 'OBJECT') {
            // For object mode, attach controls to the entire mesh
            this.attach(wrapper.render.mesh, wrapper);
        } else if (selectionMode === 'VERTEX' || selectionMode === 'EDGE' || selectionMode === 'FACE') {
            // For sub-object selection modes, you'd need custom handling here
        }
    }
}

/**
 * Apply delta transformation to the logical model based on selection mode
 */
export function applyDelta(
    delta: THREE.Matrix4,
    selectionMode: SelectionMode,
    wrapper: Wrapper,
    selectedElement: Vertex | Halfedge | Face | null
) {
    if (!wrapper) {
        console.error("Cannot apply delta: wrapper is null");
        return;
    }

    switch (selectionMode) {
        case "OBJECT": {
            // Apply transform to all vertices in the logical mesh
            for (const vertex of wrapper.logical.struct.vertices) {
                vertex.position.applyMatrix4(delta);
            }
            break;
        }
        // Add cases for VERTEX, EDGE, FACE when implementing sub-object selections
    }

    // Update the render mesh from the logical data
    wrapper.render.updateFrom(wrapper.logical);

    // Ensure bounding volumes are updated for proper raycasting
    const geometry = wrapper.render.mesh.geometry;
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
}

export default new Transform();