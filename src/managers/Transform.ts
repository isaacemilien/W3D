import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Scene from '../core/Scene';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import SceneGraph from './SceneGraph';
import Selector from './Selector';
import { SelectionMode, Wrapper, PickResult } from './types';
import { RenderMesh } from './RenderMesh';
import { LogicalMesh } from './LogicalMesh';
import { Halfedge, Vertex, HalfedgeDS, Face } from 'three-mesh-halfedge';

class Transform {
    public onTransformDelta: (delta: THREE.Matrix4) => void = () => { };
    private control: TransformControls;
    private _attachedObject: THREE.Object3D | null = null;
    private transformDummy: THREE.Object3D;

    constructor(
    ) {
        this.transformDummy = new THREE.Object3D;
        this.control = new TransformControls(Camera.camera, Renderer.renderer.domElement);
        Scene.addObject(this.control.getHelper());
        Scene.addObject(this.transformDummy);

        // on drag-end: capture delta, reset, emit
        this.control.addEventListener('dragging-changed', (event) => {
            // Inform your orbit controls to enable/disable
            if (Camera.controls) {
                Camera.controls.enabled = !event.value;
            }

            if (!event.value && this._attachedObject) {
                console.log("финк");

                // finished dragging
                const delta = this._computeDeltaMatrix();
                // reset object's local matrix
                this._attachedObject.matrix.copy(this._origMatrix!);
                this._attachedObject.matrixAutoUpdate = false;
                // notify
                this.onTransformDelta(delta);
            }
        });

        // keep track of world->local original matrix
        this._origMatrix = null;
    }

    private _origMatrix: THREE.Matrix4 | null;

    private _computeDeltaMatrix(): THREE.Matrix4 {
        // current matrix vs original
        const curr = this._attachedObject!.matrix.clone();
        const invOrig = new THREE.Matrix4().copy(this._origMatrix!).invert();
        return new THREE.Matrix4().multiplyMatrices(curr, invOrig);
    }

    /**
     * Attach the controls to a mesh/object to be transformed
     */
    public attach(object: THREE.Object3D) {
        this._attachedObject = object;
        object.updateMatrix();
        this._origMatrix = object.matrix.clone();
        object.matrixAutoUpdate = false;
        this.control.attach(object);
    }

    /**
     * Detach controls from any object
     */
    public detach() {
        this.control.detach();
        this._attachedObject = null;
        this._origMatrix = null;
    }

    /**
     * Expose mode switch (translate/rotate/scale)
     */
    public setMode(mode: 'translate' | 'rotate' | 'scale') {
        this.control.setMode(mode);
    }

    public init(selectionMode: SelectionMode, object: THREE.Object3D): void {
        this.detach();

        if (selectionMode === 'OBJECT' && object) {
            this.attach(object);
            object.updateMatrixWorld(true);
            console.log("инит");
        }
        // } else {
        //     this.transformDummy.rotation.set(0, 0, 0);
        //     this.transformDummy.scale.set(1, 1, 1);
        //     this.transformDummy.position.copy(elementPosition as THREE.Vector3);
        //     this.transformDummy.updateMatrixWorld(true);

        //     this.attach(this.transformDummy);
        // }
    }
}


/**
 * applyDelta: collapse per-mode branches into one
 */
export function applyDelta(
    delta: THREE.Matrix4,
    selectionMode: SelectionMode,
    wrapper: Wrapper,
    selectedElement: Vertex | Halfedge | Face | null
) {
    switch (selectionMode) {
        case "OBJECT": {
            // apply transform to whole mesh
            // wrapper.logical.applyMatrix(delta);
            break;
        }
        case 'VERTEX': {
            // const v = selectedElement as Vertex;
            // v.position.applyMatrix4(delta);
            break;
        }
        // case 'EDGE': {
        //     const edge = wrapper.logical.getEdge(target.id);
        //     applyPivotTransform([edge.v1, edge.v2], delta);
        //     break;
        // }
        // case 'FACE': {
        //     const face = wrapper.logical.getFace(target.id);
        //     applyPivotTransform(face.vertices, delta);
        //     break;
        // }
    }

    // finally update the render mesh from logical data
    wrapper.render.updateFrom(wrapper.logical);
}

/**
 * Helper: compute centroid for pivot
 */
function computeCentroid(
    points: Array<{ position: THREE.Vector3 }>
): THREE.Vector3 {
    const c = new THREE.Vector3(0, 0, 0);
    points.forEach(p => c.add(p.position));
    return c.divideScalar(points.length);
}

/**
 * Helper: apply delta around pivot
 */
function applyPivotTransform(
    verts: Array<{ position: THREE.Vector3 }>,
    delta: THREE.Matrix4
) {
    const pivot = computeCentroid(verts);
    verts.forEach(v => {
        v.position
            .sub(pivot)
            .applyMatrix4(delta)
            .add(pivot);
    });
}




export default new Transform();
