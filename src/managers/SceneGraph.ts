import Scene from '../core/Scene';
import { Halfedge, Vertex, HalfedgeDS, Face } from 'three-mesh-halfedge';
import * as THREE from 'three'
import { Wrapper, SelectionMode } from './types';


import Selector from './Selector';

class SceneGraph {
    private objects: Map<string, Wrapper>;

    constructor() {
        this.objects = new Map<string, Wrapper>();
    }

    /**
     * Add a wrapper object to the scene
     */
    public addObject(wrapper: Wrapper): void {
        Scene.addObject(wrapper.render.mesh);
        this.objects.set(wrapper.render.mesh.uuid, wrapper);
        this.updateSceneGraph();
    }

    /**
     * Remove an object from the scene
     */
    public removeObject(object: THREE.Object3D): void {
        const wrapper = this.objects.get(object.uuid);
        if (wrapper) {
            Scene.removeObject(object);
            this.objects.delete(object.uuid);
            this.updateSceneGraph();
        }
    }

    /**
     * Get a wrapper by its render mesh UUID
     */
    public getObjectById(id: string): Wrapper | null {
        return this.objects.get(id) || null;
    }

    /**
     * Get all render meshes in the scene
     */
    public getUnpackedSceneGraphObjects(): THREE.Object3D[] {
        return Array.from(this.objects.values()).map(wrapper => wrapper.render.mesh);
    }

    /**
     * Update the scene graph UI
     */
    public updateSceneGraph(): void {
        const sceneGraph = document.getElementById("scene-graph");
        if (!sceneGraph) return;
        
        sceneGraph.innerHTML = "";
        
        // Iterate over the objects Map entries
        this.objects.forEach((wrapper, uuid) => {
            const mesh = wrapper.render.mesh;
            const li = document.createElement("li");
            const btn = document.createElement("button");
            
            li.appendChild(btn);
            btn.textContent = `Mesh ${uuid.substring(0, 8)}...`;
            
            btn.onclick = (event: MouseEvent) => {
                // Stop propagation to prevent conflicts with raycaster
                event.stopPropagation();
                
                // Select the object when clicked in the scene graph
                const hit = {
                    object: mesh,
                    point: mesh.position.clone(),
                    distance: 0,
                    faceIndex: 0
                } as THREE.Intersection;
                
                Selector.select(hit);
            };
            
            sceneGraph.appendChild(li);
        });
    }
}

export default new SceneGraph();
