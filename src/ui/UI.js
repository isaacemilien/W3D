import * as THREE from 'three'
import Factory from '../services/Factory';
// import Updater from '../services/Updater';
import Selector from '../managers/Selector';
import Transform from '../managers/Transform';

class UI {
  constructor() {
    // Set up OBJ import functionality
    this.setupImportButton();

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

    // Temp add object definition, move later
    document.getElementById("add-cube").addEventListener("click", () => {
      Factory.createCube();
    });

    document.getElementById("move").addEventListener("click", () => {
      Transform.transformControls.setMode("translate")
    });

    document.getElementById("rot").addEventListener("click", () => {
      Transform.transformControls.setMode("rotate")
    });

    document.getElementById("scale").addEventListener("click", () => {
      Transform.transformControls.setMode("scale")
    });

    // add foreach "mode" generate
    document.getElementById("object-mode").addEventListener("click", () => {
      Selector.selectionMode = 'OBJECT';
      Transform.detach();
      Selector.clear();
    });
    document.getElementById("vertex-mode").addEventListener("click", () => {
      Selector.selectionMode = 'VERTEX';
      Transform.detach();
      Selector.clear();
    });
    document.getElementById("edge-mode").addEventListener("click", () => {
      Selector.selectionMode = 'EDGE';
      Transform.detach();
      Selector.clear();
    });
    document.getElementById("face-mode").addEventListener("click", () => {
      Selector.selectionMode = 'FACE';
      Transform.detach();
      Selector.clear();
    });

    // Add this to your main keyboard event handler
    document.addEventListener('keydown', (event) => {
      // Handle extrusion with 'E' key
      if (event.key === 'e' && !event.ctrlKey && !event.altKey) {
        if (typeof SelectionManagerHEDS !== 'undefined') {
          SelectionManagerHEDS.handleExtrusion(event);
        }
      }
    });
  }

  // Set up the OBJ import functionality
  setupImportButton() {
    // Get the file input and import button elements
    const fileInput = document.getElementById('import-obj');
    const importButton = document.getElementById('import-obj-btn');
    
    // Make the button click trigger the file input
    if (importButton && fileInput) {
      importButton.addEventListener('click', () => {
        fileInput.click();
      });
    }
    
    // Handle file selection
    if (fileInput) {
      fileInput.addEventListener('change', async (event) => {
        if (event.target.files && event.target.files.length > 0) {
          const file = event.target.files[0];
          
          // Check if it's an OBJ file
          if (file.name.toLowerCase().endsWith('.obj')) {
            try {
              // Show loading indicator
              this.showLoading(true);
              
              // Import the file
              const model = await Factory.importOBJ(file);
              
              console.log('Model imported successfully:', model);
              
              // Center the model in the view
              this.centerModelInView(model);
              
            } catch (error) {
              console.error('Error importing OBJ file:', error);
              this.showError('Failed to import OBJ file. Please try another file.');
            } finally {
              // Hide loading indicator
              this.showLoading(false);
              
              // Reset the file input so the same file can be imported again
              fileInput.value = '';
            }
          } else {
            this.showError('Please select an OBJ file.');
          }
        }
      });
    }
  }
  
  // Helper functions for import
  showLoading(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
  }
  
  showError(message) {
    alert(message);
  }
  
  centerModelInView(model) {
    if (model && model.render && model.render.mesh) {
      // Calculate the bounding box of the model
      const boundingBox = new THREE.Box3().setFromObject(model.render.mesh);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      
      // Position the model at the center of the scene
      model.render.mesh.position.sub(center);
      
      // Optionally, scale the model to fit in view if it's very large or small
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      
      if (maxDim > 10) {
        const scale = 10 / maxDim;
        model.render.mesh.scale.multiplyScalar(scale);
      }
    }
  }

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
      if (typeof SelectionManagerHEDS !== 'undefined') {
        SelectionManagerHEDS.updateHEDSFromTransform();
      }
    });

    document.getElementById("position-y").addEventListener("input", (e) => {
      object.position.y = parseFloat(e.target.value);
      if (typeof updater !== 'undefined') {
        updater.rebuildHalfedgeStructure(meshWrapper);
      }
    });

    document.getElementById("position-z").addEventListener("input", (e) => {
      object.position.z = parseFloat(e.target.value);
      if (typeof updater !== 'undefined') {
        updater.rebuildHalfedgeStructure(meshWrapper);
      }
    });

    document.getElementById("rotation-x").addEventListener("input", (e) => {
      object.rotation.x = THREE.MathUtils.degToRad(parseFloat(e.target.value));
      if (typeof updater !== 'undefined') {
        updater.rebuildHalfedgeStructure(meshWrapper);
      }
    });

    document.getElementById("rotation-y").addEventListener("input", (e) => {
      object.rotation.y = THREE.MathUtils.degToRad(parseFloat(e.target.value));
      if (typeof updater !== 'undefined') {
        updater.rebuildHalfedgeStructure(meshWrapper);
      }
    });

    document.getElementById("rotation-z").addEventListener("input", (e) => {
      object.rotation.z = THREE.MathUtils.degToRad(parseFloat(e.target.value));
      if (typeof updater !== 'undefined') {
        updater.rebuildHalfedgeStructure(meshWrapper);
      }
    });

    document.getElementById("scale-x").addEventListener("input", (e) => {
      object.scale.x = parseFloat(e.target.value);
      if (typeof updater !== 'undefined') {
        updater.rebuildHalfedgeStructure(meshWrapper);
      }
    });

    document.getElementById("scale-y").addEventListener("input", (e) => {
      object.scale.y = parseFloat(e.target.value);
      if (typeof updater !== 'undefined') {
        updater.rebuildHalfedgeStructure(meshWrapper);
      }
    });

    document.getElementById("scale-z").addEventListener("input", (e) => {
      object.scale.z = parseFloat(e.target.value);
      if (typeof updater !== 'undefined') {
        updater.rebuildHalfedgeStructure(meshWrapper);
      }
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