import * as THREE from 'three'
import Factory from '../services/Factory';
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

    document.getElementById("add-cube").addEventListener("click", () => {
      Factory.createCube();
    });

    document.getElementById("move").addEventListener("click", () => {
      Transform.control.setMode("translate")
    });

    document.getElementById("rot").addEventListener("click", () => {
      Transform.control.setMode("rotate")
    });

    document.getElementById("scale").addEventListener("click", () => {
      Transform.control.setMode("scale")
    });

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

    document.addEventListener('keydown', (event) => {
      // Handle extrusion with 'E' key
      if (event.key === 'e' && !event.ctrlKey && !event.altKey) {
        if (typeof SelectionManagerHEDS !== 'undefined') {
          SelectionManagerHEDS.handleExtrusion(event);
        }
      }
    });
    
    // Create the rights warning dialog
    this.createRightsWarningDialog();
  }
  
  // Create the rights warning dialog element
  createRightsWarningDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'rights-warning-dialog';
    dialog.style.display = 'none';
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.backgroundColor = '#3a3a3a';
    dialog.style.color = '#cccccc';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '5px';
    dialog.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    dialog.style.zIndex = '9999';
    dialog.style.width = '400px';
    dialog.style.maxWidth = '90%';
    dialog.style.border = '1px solid #555';
    
    dialog.innerHTML = `
      <h3 style="margin-top: 0; color: #ffcc00;">Content Rights Warning</h3>
      <p>Please ensure you have appropriate rights to modify and use the content you are importing.</p>
      <p style="margin-bottom: 20px; font-size: 0.85rem; color: #aaa;">Working with content without proper permissions may violate copyright laws.</p>
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancel-import" style="background: #555; border: none; color: #ccc; padding: 6px 12px; cursor: pointer; border-radius: 3px;">Cancel</button>
        <button id="confirm-import" style="background: #5285a6; border: none; color: #fff; padding: 6px 12px; cursor: pointer; border-radius: 3px;">Proceed</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
  }

  // Show the rights warning dialog and return a promise
  showRightsWarningDialog() {
    return new Promise((resolve, reject) => {
      const dialog = document.getElementById('rights-warning-dialog');
      const confirmButton = document.getElementById('confirm-import');
      const cancelButton = document.getElementById('cancel-import');
      
      dialog.style.display = 'block';
      
      const handleConfirm = () => {
        dialog.style.display = 'none';
        confirmButton.removeEventListener('click', handleConfirm);
        cancelButton.removeEventListener('click', handleCancel);
        resolve(true);
      };
      
      const handleCancel = () => {
        dialog.style.display = 'none';
        confirmButton.removeEventListener('click', handleConfirm);
        cancelButton.removeEventListener('click', handleCancel);
        resolve(false);
      };
      
      confirmButton.addEventListener('click', handleConfirm);
      cancelButton.addEventListener('click', handleCancel);
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
              // Show the rights warning dialog before proceeding
              const shouldProceed = await this.showRightsWarningDialog();
              
              if (!shouldProceed) {
                // User cancelled the import
                return;
              }
              
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