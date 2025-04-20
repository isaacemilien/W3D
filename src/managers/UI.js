import * as THREE from 'three'
import Factory from './Factory';
import Queries from './Queries';
import Updater from './Updater';
import Selector from './Selector';

class UI {
  constructor() {

    // Add the Maya-style toolbar functionality
    const modeButtons = document.querySelectorAll('.mode-button');

    // Group buttons by section for toggle behavior
    const transformButtons = document.querySelectorAll('#move, #rot, #scale');
    const selectionModeButtons = document.querySelectorAll('#object-mode, #vertex-mode, #edge-mode, #face-mode');

    // Function to handle button group toggling
    const setupToggleGroup = (buttons) => {
      buttons.forEach(button => {
        if (button) {
          button.addEventListener('click', function () {
            // Remove active class from all buttons in this group
            buttons.forEach(btn => {
              if (btn) btn.classList.remove('active');
            });
            // Add active class to clicked button
            this.classList.add('active');
          });
        }
      });
    };

    // Set up toggle groups
    setupToggleGroup(transformButtons);
    setupToggleGroup(selectionModeButtons);

    // // Add keyboard shortcuts
    // document.addEventListener('keydown', (event) => {
    //     // Prevent shortcuts when typing in input fields
    //     if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    //         return;
    //     }

    //     switch (event.key.toLowerCase()) {
    //         case 'q': // Default selection tool in Maya
    //             document.querySelector('#object-mode')?.click();
    //             break;
    //         case 'w': // Move tool
    //             document.querySelector('#move')?.click();
    //             break;
    //         case 'e': // Rotate tool
    //             document.querySelector('#rot')?.click();
    //             break;
    //         case 'r': // Scale tool
    //             document.querySelector('#scale')?.click();
    //             break;
    //         case '1':
    //             document.querySelector('#object-mode')?.click();
    //             break;
    //         case '2':
    //             document.querySelector('#vertex-mode')?.click();
    //             break;
    //         case '3':
    //             document.querySelector('#edge-mode')?.click();
    //             break;
    //         case '4':
    //             document.querySelector('#face-mode')?.click();
    //             break;
    //     }
    // });

    // // Add tooltips that show keyboard shortcuts
    // const updateTooltips = () => {
    //     if (document.querySelector('#move')) {
    //         document.querySelector('#move').setAttribute('data-tooltip', 'Move Tool (W)');
    //     }
    //     if (document.querySelector('#rot')) {
    //         document.querySelector('#rot').setAttribute('data-tooltip', 'Rotate Tool (E)');
    //     }
    //     if (document.querySelector('#scale')) {
    //         document.querySelector('#scale').setAttribute('data-tooltip', 'Scale Tool (R)');
    //     }
    //     if (document.querySelector('#object-mode')) {
    //         document.querySelector('#object-mode').setAttribute('data-tooltip', 'Object Mode (1)');
    //     }
    //     if (document.querySelector('#vertex-mode')) {
    //         document.querySelector('#vertex-mode').setAttribute('data-tooltip', 'Vertex Mode (2)');
    //     }
    //     if (document.querySelector('#edge-mode')) {
    //         document.querySelector('#edge-mode').setAttribute('data-tooltip', 'Edge Mode (3)');
    //     }
    //     if (document.querySelector('#face-mode')) {
    //         document.querySelector('#face-mode').setAttribute('data-tooltip', 'Face Mode (4)');
    //     }
    // };

    // // Run tooltip updates
    // updateTooltips();

    // Temp add object definition, move later
    document.getElementById("add-cube").addEventListener("click", () => {
      Factory.createCube();
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

    // this.createFaceSplitButton();

    // // Create and add the extrude button to the UI
    // this.createExtrusionButton();
  }


  // createFaceSplitButton() {
  //     const splitButton = document.createElement('button');
  //     splitButton.textContent = 'Split Face';
  //     splitButton.id = 'split-face';

  //     // Find an appropriate container to add the button to
  //     const container = document.getElementById('toolbar-links') || document.body;
  //     container.appendChild(splitButton);

  //     splitButton.addEventListener('click', () => {
  //         const directionOptions = ['auto', 'horizontal', 'vertical'];
  //         let direction = 'auto';

  //         // Optional: Create a simple dialog to select direction
  //         const selectedOption = prompt('Select split direction (auto, horizontal, vertical):', 'auto');
  //         if (selectedOption && directionOptions.includes(selectedOption.toLowerCase())) {
  //             direction = selectedOption.toLowerCase();
  //         }

  //         // Call the split method on the selection manager
  //         SelectionManagerHEDS.selectionManager.performFaceSplit(direction);
  //     });
  // }

  // createExtrusionButton() {
  //     const extrudeButton = document.createElement('button');
  //     extrudeButton.textContent = 'Extrude Face';
  //     extrudeButton.id = 'extrude-face';

  //     // Find an appropriate container to add the button to
  //     const container = document.getElementById('toolbar-links') || document.body;
  //     container.appendChild(extrudeButton);

  //     extrudeButton.addEventListener('click', () => {
  //         const distanceInput = prompt('Enter extrusion distance:', '1.0');
  //         const scaleInput = prompt('Enter scale factor:', '1.0');

  //         const distance = parseFloat(distanceInput) || 1.0;
  //         const scale = parseFloat(scaleInput) || 1.0;

  //         // Call the extrusion method on the selection manager
  //         SelectionManagerHEDS.extrudeFace(distance, scale);
  //     });
  // }


  updateObjectPropertiesPanel(meshWrapper) {
    const updater = new Updater();
    const object = meshWrapper.object;
    const propertiesPanel = document.getElementById("properties-container");

    // Check if an object is selected
    if (!object) {
      // Collapse the panel when no object is selected
      propertiesPanel.classList.add('collapsed');
      propertiesPanel.innerHTML = "<p>No object selected</p>";
      return;
    }

    // Expand the panel when an object is selected
    propertiesPanel.classList.remove('collapsed');
    Selector.selectObject(object);

    propertiesPanel.innerHTML = `
        <h3>Object Properties</h3>
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
        <h3>Rotation</h3>
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
        <h3>Scale</h3>
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
    `;
    // Attach event listeners to update HEDS object properties
    document.getElementById("position-x").addEventListener("input", (e) => {
        object.position.x = parseFloat(e.target.value);
        SelectionManagerHEDS.updateHEDSFromTransform();
    });

    document.getElementById("position-y").addEventListener("input", (e) => {
        object.position.y = parseFloat(e.target.value);
        updater.rebuildHalfedgeStructure(meshWrapper);
    });

    document.getElementById("position-z").addEventListener("input", (e) => {
        object.position.z = parseFloat(e.target.value);
        updater.rebuildHalfedgeStructure(meshWrapper);
    });

    document.getElementById("rotation-x").addEventListener("input", (e) => {
        object.rotation.x = THREE.MathUtils.degToRad(parseFloat(e.target.value));
        updater.rebuildHalfedgeStructure(meshWrapper);
    });

    document.getElementById("rotation-y").addEventListener("input", (e) => {
        object.rotation.y = THREE.MathUtils.degToRad(parseFloat(e.target.value));
        updater.rebuildHalfedgeStructure(meshWrapper);
    });

    document.getElementById("rotation-z").addEventListener("input", (e) => {
        object.rotation.z = THREE.MathUtils.degToRad(parseFloat(e.target.value));
        updater.rebuildHalfedgeStructure(meshWrapper);
    });

    document.getElementById("scale-x").addEventListener("input", (e) => {
        object.scale.x = parseFloat(e.target.value);
        updater.rebuildHalfedgeStructure(meshWrapper);
    });

    document.getElementById("scale-y").addEventListener("input", (e) => {
        object.scale.y = parseFloat(e.target.value);
        updater.rebuildHalfedgeStructure(meshWrapper);
    });

    document.getElementById("scale-z").addEventListener("input", (e) => {
        object.scale.z = parseFloat(e.target.value);
        updater.rebuildHalfedgeStructure(meshWrapper);
    });
  }

  togglePropertiesPanel(isVisible) {
    const propertiesPanel = document.getElementById("properties-container");

    if (isVisible) {
      propertiesPanel.classList.remove('collapsed');
    } else {
      propertiesPanel.classList.add('collapsed');
    }
  }

}

export default new UI();
