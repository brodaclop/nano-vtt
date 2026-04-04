import { Editor } from "../editor";
import { Operations } from "../operations";
import { Point } from "../utils/point";
import { World } from "../world";

document.onkeydown = e => {
    if (document.activeElement !== document.body) {
        return;
    }
    if (Editor.editMode === 'normal') {
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
            Operations.unselect();
        } else if (e.key === 'Enter') {
            Operations.lock();
        } else if (e.key === 'f') {
            Editor.flipEditMode();
        } else if (e.key === 'w') {
            Operations.move(Point.fromCoords(0, -World.grid.size));
        } else if (e.key === 'a') {
            Operations.move(Point.fromCoords(-World.grid.size, 0));
        } else if (e.key === 's') {
            Operations.move(Point.fromCoords(0, World.grid.size));
        } else if (e.key === 'd') {
            Operations.move(Point.fromCoords(World.grid.size, 0));
        } else {
            return;
        }
    }
    else {
        if (e.key === 'Escape') {
            Editor.flipEditMode();
        } else {
            return;
        }
    }
    e.preventDefault();
}
