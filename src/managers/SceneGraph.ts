import Scene from '../core/Scene';
import { HalfedgeDS, } from 'three-mesh-halfedge';
import { Object3D } from 'three'; // Assuming we're using Three.js

interface SceneObjectEntry {
    object: Object3D;
    heStruct: HalfedgeDS;
}

class SceneGraph {
    private objects: Map<string, SceneObjectEntry>;

    constructor() {
        this.objects = new Map<string, SceneObjectEntry>();
    }

    public addObject(object: Object3D, heStruct: HalfedgeDS): void {
        Scene.addObject(object);

        this.objects.set(object.uuid, {
            object,
            heStruct,
        });
    }

    public removeObject(object: Object3D): void {
        const entry = this.objects.get(object.uuid);
        if (entry) {
            Scene.removeObject(object);
            this.objects.delete(object.uuid);
        }
    }

    public getObjectById(id: string): SceneObjectEntry | null {
        return this.objects.get(id) || null;
    }
}

export default new SceneGraph();
