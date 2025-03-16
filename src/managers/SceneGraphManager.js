import Scene from '../core/Scene';
import SelectionManager from './SelectionManager'

class SceneGraphManager {
    constructor() {
        this.objects = new Map();
    }

    addObject(object, parent = null) {
        if (parent) {
            parent.add(object);
        } else {
            Scene.addObject(object);
        }
        this.objects.set(object.uuid, { object, parent });
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
                SelectionManager.selectObject(obj);
            }
            sceneGraph.appendChild(li);
        });
    }
}

export default new SceneGraphManager();
