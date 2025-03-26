import * as THREE from 'three'
import SelectionManagerHEDS from '../managers/SelectionManagerHEDS';
import SceneGraphManager from '../managers/SceneGraphManager';
import PrimitiveFactory from '../models/PrimitiveFactory';

class UI {
    constructor() {


        // Temp add object definition, move later
        document.getElementById("add-cube").addEventListener("click", () => {
            const cube = PrimitiveFactory.createCubeHEDS();
            SceneGraphManager.addObject(cube.object, cube.heMesh);
            console.log("from tsdfsdfsdfsdfshe adders");

        }, { once: true });

        document.getElementById("add-sphere").addEventListener("click", () => {
            SceneGraphManager.addObject(PrimitiveFactory.createSphere());
        });

        document.getElementById("move").addEventListener("click", () => {
            SelectionManagerHEDS.transformControls.setMode("translate")
        });

        document.getElementById("rot").addEventListener("click", () => {
            SelectionManagerHEDS.transformControls.setMode("rotate")
        });

        document.getElementById("scale").addEventListener("click", () => {
            SelectionManagerHEDS.transformControls.setMode("scale")
        });


        document.getElementById("object-mode").addEventListener("click", () => {
            SelectionManagerHEDS.selectionMode = 'OBJECT';
            SelectionManagerHEDS.transformControls.detach();
            SelectionManagerHEDS.selectedElement = null;
        });
        document.getElementById("vertex-mode").addEventListener("click", () => {
            SelectionManagerHEDS.selectionMode = 'VERTEX';
            SelectionManagerHEDS.transformControls.detach();
            SelectionManagerHEDS.selectedElement = null;
        });
        document.getElementById("edge-mode").addEventListener("click", () => {
            SelectionManagerHEDS.selectionMode = 'EDGE';
            SelectionManagerHEDS.transformControls.detach();
            SelectionManagerHEDS.selectedElement = null;
        });
        document.getElementById("face-mode").addEventListener("click", () => {
            SelectionManagerHEDS.selectionMode = 'FACE';
            SelectionManagerHEDS.transformControls.detach();
            SelectionManagerHEDS.selectedElement = null;
        });

        // Add this to your main keyboard event handler
        document.addEventListener('keydown', (event) => {
            // Handle extrusion with 'E' key
            if (event.key === 'e' && !event.ctrlKey && !event.altKey) {
                SelectionManagerHEDS.handleExtrusion(event);
            }
        });

        this.createFaceSplitButton();

        // Create and add the extrude button to the UI
        this.createExtrusionButton();
    }

    createFaceSplitButton() {
        const splitButton = document.createElement('button');
        splitButton.textContent = 'Split Face';
        splitButton.id = 'split-face';

        // Find an appropriate container to add the button to
        const container = document.getElementById('toolbar-links') || document.body;
        container.appendChild(splitButton);

        splitButton.addEventListener('click', () => {
            const directionOptions = ['auto', 'horizontal', 'vertical'];
            let direction = 'auto';

            // Optional: Create a simple dialog to select direction
            const selectedOption = prompt('Select split direction (auto, horizontal, vertical):', 'auto');
            if (selectedOption && directionOptions.includes(selectedOption.toLowerCase())) {
                direction = selectedOption.toLowerCase();
            }

            // Call the split method on the selection manager
            SelectionManagerHEDS.selectionManager.performFaceSplit(direction);
        });
    }

    createExtrusionButton() {
        const extrudeButton = document.createElement('button');
        extrudeButton.textContent = 'Extrude Face';
        extrudeButton.id = 'extrude-face';

        // Find an appropriate container to add the button to
        const container = document.getElementById('toolbar-links') || document.body;
        container.appendChild(extrudeButton);

        extrudeButton.addEventListener('click', () => {
            const distanceInput = prompt('Enter extrusion distance:', '1.0');
            const scaleInput = prompt('Enter scale factor:', '1.0');

            const distance = parseFloat(distanceInput) || 1.0;
            const scale = parseFloat(scaleInput) || 1.0;

            // Call the extrusion method on the selection manager
            SelectionManagerHEDS.extrudeFace(distance, scale);
        });
    }


    // ISSUE editing rot || scale in attribute editor ? axis locked to world origin
    updateObjectPropertiesPanel(object) {
        const propertiesPanel = document.getElementById("properties-container");
        if (!object) {
            propertiesPanel.innerHTML = "<p>No object selected</p>";
            return;
        }

        // Get the HEDS object from SceneGraphManager
        const hedObject = SceneGraphManager.objects.get(object.uuid);
        if (!hedObject) {
            console.error("HEDS object not found.");
            return;
        }

        propertiesPanel.innerHTML = `
          <label>
            Position X:
            <input type="number" id="position-x" value="${hedObject.object.position.x}" step="0.1">
          </label>
          <label>
            Position Y:
            <input type="number" id="position-y" value="${hedObject.object.position.y}" step="0.1">
          </label>
          <label>
            Position Z:
            <input type="number" id="position-z" value="${hedObject.object.position.z}" step="0.1">
          </label>
          <label>
            Rotation X:
            <input type="number" id="rotation-x" value="${THREE.MathUtils.radToDeg(hedObject.object.rotation.x)}" step="1">
          </label>
          <label>
            Rotation Y:
            <input type="number" id="rotation-y" value="${THREE.MathUtils.radToDeg(hedObject.object.rotation.y)}" step="1">
          </label>
          <label>
            Rotation Z:
            <input type="number" id="rotation-z" value="${THREE.MathUtils.radToDeg(hedObject.object.rotation.z)}" step="1">
          </label>
          <label>
            Scale X:
            <input type="number" id="scale-x" value="${hedObject.object.scale.x}" step="0.1">
          </label>
          <label>
            Scale Y:
            <input type="number" id="scale-y" value="${hedObject.object.scale.y}" step="0.1">
          </label>
          <label>
            Scale Z:
            <input type="number" id="scale-z" value="${hedObject.object.scale.z}" step="0.1">
          </label>
          <h3>Pivot Point</h3>
        `;

        // Attach event listeners to update HEDS object properties
        document.getElementById("position-x").addEventListener("input", (e) => {
            hedObject.object.position.x = parseFloat(e.target.value);
            SelectionManagerHEDS.updateHEDSFromTransform();
        });

        document.getElementById("position-y").addEventListener("input", (e) => {
            hedObject.object.position.y = parseFloat(e.target.value);
            SelectionManagerHEDS.updateHEDSFromTransform();
        });

        document.getElementById("position-z").addEventListener("input", (e) => {
            hedObject.object.position.z = parseFloat(e.target.value);
            SelectionManagerHEDS.updateHEDSFromTransform();
        });

        document.getElementById("rotation-x").addEventListener("input", (e) => {
            hedObject.object.rotation.x = THREE.MathUtils.degToRad(parseFloat(e.target.value));
            SelectionManagerHEDS.updateHEDSFromTransform();
        });

        document.getElementById("rotation-y").addEventListener("input", (e) => {
            hedObject.object.rotation.y = THREE.MathUtils.degToRad(parseFloat(e.target.value));
            SelectionManagerHEDS.updateHEDSFromTransform();
        });

        document.getElementById("rotation-z").addEventListener("input", (e) => {
            hedObject.object.rotation.z = THREE.MathUtils.degToRad(parseFloat(e.target.value));
            SelectionManagerHEDS.updateHEDSFromTransform();
        });

        document.getElementById("scale-x").addEventListener("input", (e) => {
            hedObject.object.scale.x = parseFloat(e.target.value);
            SelectionManagerHEDS.updateHEDSFromTransform();
        });

        document.getElementById("scale-y").addEventListener("input", (e) => {
            hedObject.object.scale.y = parseFloat(e.target.value);
            SelectionManagerHEDS.updateHEDSFromTransform();
        });

        document.getElementById("scale-z").addEventListener("input", (e) => {
            hedObject.object.scale.z = parseFloat(e.target.value);
            SelectionManagerHEDS.updateHEDSFromTransform();
        });
    }



}

export default new UI();
