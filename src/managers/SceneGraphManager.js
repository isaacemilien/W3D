import Scene from '../core/Scene';
import SelectionManagerHEDS from './SelectionManagerHEDS'

class SceneGraphManager {
    constructor() {
        this.objects = new Map();
    }

    addObject(object, heMesh, parent = null) {
        if (parent) {
            parent.add(object);
        } else {
            Scene.addObject(object);
        }

        // Create edge wireframe from the half-edge mesh
        const edgeWireframe = heMesh.createEdgeWireframe();

        // Add wireframe to scene, not as child of object
        Scene.addObject(edgeWireframe);

        // Link the wireframe to the object for transforms
        const linkWireframeToObject = () => {
            if (edgeWireframe && object) {
                // Copy object's world transform to wireframe
                object.updateWorldMatrix(true, false);
                edgeWireframe.position.copy(object.position);
                edgeWireframe.quaternion.copy(object.quaternion);
                edgeWireframe.scale.copy(object.scale);
            }
        };

        // Initial positioning
        linkWireframeToObject();

        // Store both the object and its wireframe along with the linking function
        this.objects.set(object.uuid, {
            object,
            parent,
            heMesh,
            edgeWireframe,
            linkWireframeToObject
        });

        this.updateSceneGraph();
    }

    removeObject(object) {
        const entry = this.objects.get(object.uuid);
        if (entry) {
            if (entry.parent) {
                entry.parent.remove(object);
            } else {
                Scene.removeObject(object);
            }

            // Remove the wireframe too
            if (entry.edgeWireframe) {
                Scene.removeObject(entry.edgeWireframe);
            }

            this.objects.delete(object.uuid);
        }
    }

    getObjectById(id) {
        return this.objects.get(id)?.object || null;
    }

    updateSceneGraph() {
        const sceneGraph = document.getElementById("scene-graph");
        sceneGraph.innerHTML = "";

        // Temp copy paste from SelectionManager, find better access 
        const unpackedSceneGraphObjects = Array.from(this.objects.values()).map(value => value.object)

        unpackedSceneGraphObjects.forEach((obj) => {
            const li = document.createElement("li");
            const btn = document.createElement("button");
            li.appendChild(btn);
            btn.textContent = `${obj.userData.name}`;
            btn.onclick = (event) => {
                // stopPropogation to stop onclick event conflicts that raycaster uses
                event.stopPropagation()
                console.log("здарова");
                SelectionManagerHEDS.selectObject(obj);
            }
            sceneGraph.appendChild(li);
        });
    }

    // temp method to unpack scene graph objects, not yet implemented in code
    getUnpackedSceneGraphObjects() {
        return Array.from(this.objects.values()).map(value => value.object);
    }
    getUnpackedSceneGraphMeshes() {
        return Array.from(this.objects.values()).map(value => value.heMesh);
    }

    updateWireframes() {
        for (const entry of this.objects.values()) {
            if (entry.linkWireframeToObject) {
                entry.linkWireframeToObject();
            }
        }
    }
}

export default new SceneGraphManager();
