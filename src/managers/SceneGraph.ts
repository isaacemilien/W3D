import Scene from '../core/Scene';
import { Halfedge, Vertex, HalfedgeDS, Face } from 'three-mesh-halfedge';
import { Mesh, Object3D } from 'three'; // Assuming we're using Three.js
import { Wrapper, SelectionMode } from './types';


class SceneGraph {
    private objects: Map<string, Wrapper>;

    constructor() {
        this.objects = new Map<string, Wrapper>();
    }

    public addObject(wrapper: Wrapper): void {
        Scene.addObject(wrapper.render.mesh);

        this.objects.set(wrapper.render.mesh.uuid, wrapper);

        this.updateSceneGraph()
    }

    public removeObject(object: Object3D): void {
        const entry = this.objects.get(object.uuid);
        if (entry) {
            Scene.removeObject(object);
            this.objects.delete(object.uuid);
        }
    }

    public getObjectById(id: string): Wrapper | null {
        return this.objects.get(id) || null;
    }

    public getUnpackedSceneGraphObjects(): Object3D[] {
        return Array.from(this.objects.values()).map(value => value.render.mesh);
    }

    public updateSceneGraph(): void {
        const sceneGraph = document.getElementById("scene-graph");
        if (!sceneGraph) return;
        
        sceneGraph.innerHTML = "";
        
        // Directly iterate over the objects Map entries
        this.objects.forEach((meshWrapper, uuid) => {
            const obj = meshWrapper.render.mesh;
            const li = document.createElement("li");
            const btn = document.createElement("button");
            
            li.appendChild(btn);
            btn.textContent = `${obj.uuid}`;
            
            btn.onclick = (event: MouseEvent) => {
                // stopPropagation to stop onclick event conflicts that raycaster uses
                event.stopPropagation();
                console.log("здарова");
                // SelectionManagerHEDS.selectObject(obj);
                // Selector.selectObject(obj);
            };
            
            sceneGraph.appendChild(li);
        });
    }
}

export default new SceneGraph();
