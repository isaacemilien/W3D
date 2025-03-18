import * as THREE from 'three'
import SelectionManager from '../managers/SelectionManagerHEDS';
import SceneGraphManager from '../managers/SceneGraphManager';
import PrimitiveFactory from '../models/PrimitiveFactory';

class UI {
    constructor() {
        // Temp add object definition, move later
        document.getElementById("add-cube").addEventListener("click", () => {
            const cube = PrimitiveFactory.createCubeHEDS();
            SceneGraphManager.addObject(cube.object, cube.heMesh);
        });

        document.getElementById("add-sphere").addEventListener("click", () => {
            SceneGraphManager.addObject(PrimitiveFactory.createSphere());
        });

        document.getElementById("move").addEventListener("click", () => {
            SelectionManager.transformControls.setMode("translate")
        });

        document.getElementById("rot").addEventListener("click", () => {
            SelectionManager.transformControls.setMode("rotate")
        });

        document.getElementById("scale").addEventListener("click", () => {
            SelectionManager.transformControls.setMode("scale")
        });


        document.getElementById("object-mode").addEventListener("click", () => {
            SelectionManager.selectionMode = 'OBJECT';
            SelectionManager.transformControls.detach();
            SelectionManager.selectedElement = null;
        });
        document.getElementById("vertex-mode").addEventListener("click", () => {
            SelectionManager.selectionMode = 'VERTEX';
            SelectionManager.transformControls.detach();
            SelectionManager.selectedElement = null;
        });
        document.getElementById("edge-mode").addEventListener("click", () => {
            SelectionManager.selectionMode = 'EDGE';
            SelectionManager.transformControls.detach();
            SelectionManager.selectedElement = null;
        });
        document.getElementById("face-mode").addEventListener("click", () => {
            SelectionManager.selectionMode = 'FACE';
            SelectionManager.transformControls.detach();
            SelectionManager.selectedElement = null;
        });
    }




    updateObjectPropertiesPanel(object) {
        const propertiesPanel = document.getElementById("properties-container");
        if (!object) {
            propertiesPanel.innerHTML = "<p>No object selected</p>";
            return;
        }

        const mesh = object.userData.meshReference;
        propertiesPanel.innerHTML = `
          <label>
            Position X:
            <input type="number" id="position-x" value="${object.position.x}" step="0.1">
          </label>
          <label>
            Position Y:
            <input type="number" id="position-y" value="${object.position.y}" step="0.1">
          </label>
          <label>
            Position Z:
            <input type="number" id="position-z" value="${object.position.z}" step="0.1">
          </label>
          <label>
            Rotation X:
            <input type="number" id="rotation-x" value="${THREE.MathUtils.radToDeg(object.rotation.x)}" step="1">
          </label>
          <label>
            Rotation Y:
            <input type="number" id="rotation-y" value="${THREE.MathUtils.radToDeg(object.rotation.y)}" step="1">
          </label>
          <label>
            Rotation Z:
            <input type="number" id="rotation-z" value="${THREE.MathUtils.radToDeg(object.rotation.z)}" step="1">
          </label>
          <label>
            Scale X:
            <input type="number" id="scale-x" value="${object.scale.x}" step="0.1">
          </label>
          <label>
            Scale Y:
            <input type="number" id="scale-y" value="${object.scale.y}" step="0.1">
          </label>
          <label>
            Scale Z:
            <input type="number" id="scale-z" value="${object.scale.z}" step="0.1">
          </label>
          <h3>Pivot Point</h3>

        `;
        //   <label>
        //     Pivot X:
        //     <input type="number" id="pivot-x" value="${-mesh.position.x}" step="0.1">
        //   </label>
        //   <label>
        //     Pivot Y:
        //     <input type="number" id="pivot-y" value="${-mesh.position.y}" step="0.1">
        //   </label>
        //   <label>
        //     Pivot Z:
        //     <input type="number" id="pivot-z" value="${-mesh.position.z}" step="0.1">
        //   </label>


        document.getElementById("position-x").addEventListener("input", (e) => {
            object.position.x = parseFloat(e.target.value);
        });
        document.getElementById("position-y").addEventListener("input", (e) => {
            object.position.y = parseFloat(e.target.value);
        });
        document.getElementById("position-z").addEventListener("input", (e) => {
            object.position.z = parseFloat(e.target.value);
        });
        document.getElementById("rotation-x").addEventListener("input", (e) => {
            object.rotation.x = THREE.MathUtils.degToRad(parseFloat(e.target.value));
        });
        document.getElementById("rotation-y").addEventListener("input", (e) => {
            object.rotation.y = THREE.MathUtils.degToRad(parseFloat(e.target.value));
        });
        document.getElementById("rotation-z").addEventListener("input", (e) => {
            object.rotation.z = THREE.MathUtils.degToRad(parseFloat(e.target.value));
        });
        document.getElementById("scale-x").addEventListener("input", (e) => {
            object.scale.x = parseFloat(e.target.value);
        });
        document.getElementById("scale-y").addEventListener("input", (e) => {
            object.scale.y = parseFloat(e.target.value);
        });
        document.getElementById("scale-z").addEventListener("input", (e) => {
            object.scale.z = parseFloat(e.target.value);
        });

        // document.getElementById("pivot-x").addEventListener("input", (e) => {
        //     updatePivotPoint(object, parseFloat(e.target.value), mesh.position.y, mesh.position.z);
        // });
        // document.getElementById("pivot-y").addEventListener("input", (e) => {
        //     updatePivotPoint(object, mesh.position.x, parseFloat(e.target.value), mesh.position.z);
        // });
        // document.getElementById("pivot-z").addEventListener("input", (e) => {
        //     updatePivotPoint(object, mesh.position.x, mesh.position.y, parseFloat(e.target.value));
        // });
    }
}

export default new UI();
