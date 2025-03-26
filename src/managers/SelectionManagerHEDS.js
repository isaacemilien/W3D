import ExtrusionOperator from './selection/ExtrusionOperator';
import SelectionManager from './Selection/SelectionManager';

// Facade for selection system, backward compatible
class SelectionManagerHEDS {
    constructor() {
        // Create the selection manager instance
        this.selectionManager = SelectionManager;

        // Initialize the selection system
        this.selectionManager.initialize();

        // Set up public properties that match the original API
        this.selectedObject = null;
        this.selectedElement = null;
        this.transformControls = this.selectionManager.transformManager.transformControls;

        // Expose selection mode as a property with a getter/setter
        Object.defineProperty(this, 'selectionMode', {
            get: () => this.selectionManager.selectionMode,
            set: (mode) => this.selectionManager.setSelectionMode(mode)
        });
    }

    // Public API methods that match the original class
    selectObject(object) {
        this.selectionManager.selectObject(object);
        this.selectedObject = object;
    }

    extrudeFace(distance = 1.0, scale = 1.0) {
        this.selectionManager.performExtrusion(distance, scale);
    }

    handleExtrusion(event) {
        if (event.key === 'e' && this.selectionMode === 'FACE' && this.selectedElement) {
            this.extrudeFace(1.0, 1.0);
        }
    }

    updateHEDSFromTransform() {
        // This is handled internally by the SelectionManager now
        const transformMatrix = this.selectionManager.transformManager.getLastMatrix();
        this.selectionManager.handleTransformUpdate(transformMatrix);
    }
}

export default new SelectionManagerHEDS();