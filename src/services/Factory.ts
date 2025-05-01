import * as THREE from 'three';
import { Wrapper } from '../data/types';
import { LogicalMesh } from '../data/LogicalMesh';
import { RenderMesh } from '../data/RenderMesh';
import SceneGraph from './SceneGraph';
import OBJImporter from './OBJImporter';

class Factory {
    /**
     * Create a cube mesh and add it to the scene
     */
    static createCube(): Wrapper {
        // Create the logical mesh (authoritative data)
        const logical = LogicalMesh.createCube(1);

        // Create the render mesh (visual representation)
        const material = new THREE.MeshStandardMaterial({
            color: "#b2b2b2",
            metalness: 0,
            roughness: 0.5
        });
        const render = new RenderMesh(material);

        // Update the render mesh from the logical data
        render.updateFrom(logical);

        // Create the wrapper
        const wrapper = { logical, render };

        // Add to scene graph
        SceneGraph.addObject(wrapper);

        return wrapper;
    }

    /**
     * Import an OBJ model and add it to the scene
     */
    static async importOBJ(file: File): Promise<Wrapper> {
        // Import the OBJ file and create a logical mesh
        const logical = await OBJImporter.createFromFile(file);
        
        // Create the render mesh
        const material = new THREE.MeshStandardMaterial({
            color: "#b2b2b2",
            metalness: 0,
            roughness: 0.5
        });
        const render = new RenderMesh(material);
        
        // Update the render mesh from the logical data
        render.updateFrom(logical);
        
        // Create the wrapper
        const wrapper = { logical, render };
        
        // Add to scene graph
        SceneGraph.addObject(wrapper);
        
        return wrapper;
    }
}

export default Factory;