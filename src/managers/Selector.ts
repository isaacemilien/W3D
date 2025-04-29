import * as THREE from 'three';
import { Halfedge, Vertex, Face, HalfedgeDS } from 'three-mesh-halfedge';
import { SelectionMode, Wrapper } from './types';
import SceneGraph from './SceneGraph';
import Transform, { applyDelta } from './Transform';
import { Resolver } from './Resolver';
import { extrudeFace } from './extrudeFace';

class Selector {
    public selectedElement: Vertex | Halfedge | Face | null = null;
    public selectedObject: THREE.Object3D | null = null;
    public selectedWrapper: Wrapper | null = null;
    public selectionMode: SelectionMode = 'OBJECT';

    /**
     * Select an object or element based on raycaster hit
     */
    public select(hit: THREE.Intersection) {
        const resolver = new Resolver();
        const result = resolver.getTarget(hit, this.selectionMode);
        

        if (!result) return;

        this.selectedElement = result.pickedElement;
        this.selectedObject = result.pickedObject;
        this.selectedWrapper = result.wrapper;

        // Set up transform controls for the selected object
        Transform.init(this.selectionMode, this.selectedWrapper, result.pivotPosition, this.selectedElement);
        
        // Set up the transform delta callback
        Transform.onTransformDelta = (delta) => {
            console.log("эксит")
            if (!this.selectedWrapper) return;
            // Apply delta transformation to the logical model
            applyDelta(
                delta, 
                this.selectionMode, 
                this.selectedWrapper, 
                this.selectedElement
            );
        };
    }

    /**
     * Clear the current selection
     */
    public clear() {
        this.selectedElement = null;
        this.selectedObject = null;
        this.selectedWrapper = null;
        Transform.detach();
    }

    public extrudeFace(){
        if(this.selectedElement != null && this.selectionMode === "FACE"){
            extrudeFace(this.selectedWrapper?.logical.struct as HalfedgeDS, this.selectedElement as Face, 1)
            this.selectedWrapper?.render.updateFrom(this.selectedWrapper.logical);
        }
    }

}

export default new Selector();