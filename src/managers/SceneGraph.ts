import Scene from '../core/Scene';
import { Halfedge, Vertex, HalfedgeDS, Face } from 'three-mesh-halfedge';
import { Mesh, Object3D } from 'three'; // Assuming we're using Three.js
import { MeshWrapper } from './types';

type SelectionMode = 'OBJECT' | 'VERTEX' | 'EDGE' | 'FACE';

class SceneGraph {
    private objects: Map<string, MeshWrapper>;

    public selectedObject: boolean;
    public selectionMode: SelectionMode;
    public selectedElement: Vertex | Halfedge | Face | null;
    public currentMeshWrapper: MeshWrapper; // Current { object, heMesh, ... } from SceneGraphManager


    constructor() {
        this.objects = new Map<string, MeshWrapper>();
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

    public getObjectById(id: string): MeshWrapper | null {
        return this.objects.get(id) || null;
    }

    public getUnpackedSceneGraphObjects(): Object3D[] {
        return Array.from(this.objects.values()).map(value => value.object);
    }
}

export default new SceneGraph();
