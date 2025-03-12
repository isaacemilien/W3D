import Scene from '../core/Scene';

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
}

export default new SceneGraphManager();
