import Scene from '../core/Scene';
import { Halfedge, Vertex, HalfedgeDS, Face } from 'three-mesh-halfedge';
import { Mesh, Object3D } from 'three'; // Assuming we're using Three.js
import { MeshWrapper, SelectionMode } from './types';
import Selector from './Selector';


class SceneGraph {
    private objects: Map<string, MeshWrapper>;

    constructor() {
        this.objects = new Map<string, MeshWrapper>();
    }

    public addObject(object: Object3D, heStruct: HalfedgeDS): void {
        Scene.addObject(object);

        this.objects.set(object.uuid, {
            object,
            heStruct,
        });

        this.updateSceneGraph()
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

    public updateSceneGraph(): void {
        const sceneGraph = document.getElementById("scene-graph");
        if (!sceneGraph) return;
        
        sceneGraph.innerHTML = "";
        
        // Directly iterate over the objects Map entries
        this.objects.forEach((meshWrapper, uuid) => {
            const obj = meshWrapper.object;
            const li = document.createElement("li");
            const btn = document.createElement("button");
            
            li.appendChild(btn);
            btn.textContent = `${obj.uuid}`;
            
            btn.onclick = (event: MouseEvent) => {
                // stopPropagation to stop onclick event conflicts that raycaster uses
                event.stopPropagation();
                console.log("здарова");
                // SelectionManagerHEDS.selectObject(obj);
                Selector.setSelectedElement(meshWrapper, null, "OBJECT")
            };
            
            sceneGraph.appendChild(li);
        });
    }
}

export default new SceneGraph();
