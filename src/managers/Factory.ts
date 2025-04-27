import * as THREE from 'three';
import { Wrapper } from './types';
import { LogicalMesh } from './LogicalMesh';
import { RenderMesh } from './RenderMesh';
import SceneGraph from './SceneGraph';

class Factory {
    /**
     * Create a cube mesh and add it to the scene
     */
    static createCube(): Wrapper {
        // Create the logical mesh (authoritative data)
        const logical = LogicalMesh.createCube(1);

        // Create the render mesh (visual representation)
        const material = new THREE.MeshStandardMaterial({
            color: 0x6699ff,
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

    // /**
    //  * Create a sphere mesh and add it to the scene
    //  */
    // static createSphere(radius: number = 0.5, segments: number = 16): Wrapper {
    //     // Create the logical mesh
    //     const logical = LogicalMesh.createSphere(radius, segments);

    //     // Create the render mesh
    //     const material = new THREE.MeshStandardMaterial({ 
    //         color: 0x66cc99, 
    //         metalness: 0, 
    //         roughness: 0.5 
    //     });
    //     const render = new RenderMesh(material);

    //     // Update the render mesh from the logical data
    //     render.updateFrom(logical);

    //     // Create the wrapper
    //     const wrapper = { logical, render };

    //     // Add to scene graph
    //     SceneGraph.addObject(wrapper);

    //     return wrapper;
    // }
}

export default Factory;