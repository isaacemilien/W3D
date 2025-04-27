import Selector from "./Selector";
import Picker from "./Picker";
import Transform from "./Transform";

class InputManager {
    constructor() {
        // Mouse click for selection
        window.addEventListener('click', this.onMouseClick);

        // Keyboard shortcuts for transform modes
        window.addEventListener('keydown', this.onKeyDown);
    }

    private onMouseClick = (event: MouseEvent) => {
        // Ignore clicks on UI elements
        if ((event.target as Element).closest('.toolbar, .panel, #scene-graph')) {
            return;
        }

        const hit = Picker.getRaycastHit(event);

        if (!hit) {

            Selector.clear();
            return;
        }

        Selector.select(hit);
    };

    private onKeyDown = (event: KeyboardEvent) => {
        // Ignore keyboard events when typing in input fields
        if (document.activeElement?.tagName === 'INPUT' ||
            document.activeElement?.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key.toLowerCase()) {
            // Transform modes
            case 'g': // Maya-style G for translate/grab
            case 'w': // Blender-style W for translate
                Transform.setMode('translate');
                event.preventDefault();
                break;

            case 'r': // Both Maya and Blender use R for rotate
                Transform.setMode('rotate');
                event.preventDefault();
                break;

            case 's': // Both Maya and Blender use S for scale
                Transform.setMode('scale');
                event.preventDefault();
                break;

            // Selection modes
            case '1':
                document.getElementById('object-mode')?.click();
                event.preventDefault();
                break;

            case '2':
                document.getElementById('vertex-mode')?.click();
                event.preventDefault();
                break;

            case '3':
                document.getElementById('edge-mode')?.click();
                event.preventDefault();
                break;

            case '4':
                document.getElementById('face-mode')?.click();
                event.preventDefault();
                break;

            // Escape to deselect
            case 'escape':
                Selector.clear();
                event.preventDefault();
                break;
        }
    };
}

export default new InputManager();