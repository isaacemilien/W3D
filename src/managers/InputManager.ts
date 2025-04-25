import Selector from "./Selector";
import Picker from "./Picker"

class InputManager {
    constructor() {
        window.addEventListener('click', this.onMouseClick);
    }

    private onMouseClick = (event: MouseEvent) => {
        const hit = Picker.getRaycastHit(event);

        if (!hit) {
            Selector.clear();
            return;
        }

        Selector.select(hit);
    };
}

export default new InputManager()