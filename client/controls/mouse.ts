import { Operations } from "../operations";
import { Point } from "../utils/point";
import { Viewport } from "../viewport";
import { World } from "../world";

const ACCEPTED_TYPES: Array<string> = ['image/png', 'image/jpeg', 'image/webp'];


let drag: { x: number, y: number } | undefined = undefined;
let dragActive = false;

document.addEventListener('wheel', (e: WheelEvent) => {
    if (!e.altKey && !e.shiftKey && !e.ctrlKey && e.deltaY !== 0) {
        Operations.zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
        e.preventDefault();
    }
});

document.addEventListener('mousemove', (e) => {
    if (e.buttons & 5 && World.getEditMode() === 'normal') {
        const oldDrag = drag;
        drag = Point.fromCoords(e.clientX, e.clientY);
        if (oldDrag) {
            const delta = Point.fromCoords(drag.x - oldDrag.x, drag.y - oldDrag.y);
            if (World.selected && e.buttons & 1) {
                Operations.move(Point.scale(delta, 1 / Viewport.zoom()));
            } else {
                Viewport.moveOrigin(delta);
            }
        } else {
            dragActive = true;
        }
        e.preventDefault();
    }
});

document.addEventListener('mouseup', (e) => {
    if (dragActive) {
        drag = undefined;
        dragActive = false;
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});

document.addEventListener('dragstart', e => {
    e.preventDefault();
});

document.addEventListener('dragover', e => {
    e.preventDefault();
});

document.addEventListener('dragenter', e => {
    e.preventDefault();
});


document.addEventListener('drop', e => {
    const worldCoord = Viewport.screen2World(Point.fromCoords(e.clientX, e.clientY));
    if (e.dataTransfer?.items.length === 1) {
        const item = e.dataTransfer.items[0];
        if (ACCEPTED_TYPES.includes(item.type)) {
            const file = item.getAsFile();
            if (file) {
                Operations.add(file, worldCoord.x, worldCoord.y);
            }
        }
    }
    e.preventDefault();
});

export const isDragging = () => dragActive;