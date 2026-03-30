import { Editor } from "../editor";
import { Operations } from "../operations";

document.onkeydown = e => {
    if (document.activeElement !== document.body) {
        return;
    }
    if (e.key === 'Delete') {
        Operations.remove();
    } else if (e.key === '+') {
        Operations.zoom(1.1);
    } else if (e.key === '-') {
        Operations.zoom(1 / 1.1);
    } else if (e.key === 'ArrowLeft') {
        Operations.rotate(-5);
    } else if (e.key === 'ArrowRight') {
        Operations.rotate(5);
    } else if (e.key === 'ArrowUp') {
        Operations.sendToTop();
    } else if (e.key === 'ArrowDown') {
        Operations.sendToBottom();
    } else if (e.key === 'Tab') {
        if (e.shiftKey) {
            Operations.selectPrevious();
        } else {
            Operations.selectNext();
        }
    } else if (e.key === 'Escape') {
        if (Editor.editMode === 'fog') {
            Editor.flipEditMode();
        } else {
            Operations.unselect();
        }
    } else if (e.key === 'Enter') {
        Operations.lock();
    } else {
        return;
    }
    e.preventDefault();
}
