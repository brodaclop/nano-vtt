import { Operations } from "./operations";
import { Point } from "./point";
import { Viewport } from "./viewport";
import { World } from "./world";


export const initDrag = () => {
    console.log('drag init');
};

let drag: { x: number, y: number } | undefined = undefined;
let dragActive = false;

document.onmousemove = (e) => {
    if (e.buttons & 5 && World.getEditMode() === 'normal') {
        const oldDrag = drag;
        drag = Point.fromCoords(e.clientX, e.clientY);
        if (oldDrag) {
            const delta = Point.fromCoords(drag.x - oldDrag.x, drag.y - oldDrag.y);
            if (World.selected) {
                Operations.move(Point.scale(delta, 1 / Viewport.zoom()));
            } else {
                Viewport.moveOrigin(delta);
            }
        } else {
            dragActive = true;
        }
        e.preventDefault();
    }
}

document.onmouseup = (e) => {
    if (dragActive) {
        drag = undefined;
        dragActive = false;
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

document.ondragstart = e => {
    e.preventDefault();
}

document.ondragover = e => {
    e.preventDefault();
}

document.ondragenter = e => {
    e.preventDefault();
}

const ACCEPTED_TYPES: Array<string> = ['image/png', 'image/jpeg', 'image/webp'];

document.ondrop = e => {
    const worldCoord = Viewport.screen2World(Point.fromCoords(e.clientX, e.clientY));
    const url = e.dataTransfer?.getData('URL');
    if (url) {
        try {
            (async () => {
                const res = await fetch(url);
                if (res.ok && ACCEPTED_TYPES.includes(res.headers.get('content-type')!)) {
                    Operations.add(await res.blob(), worldCoord.x, worldCoord.y);
                }
            })();
        } catch (e) {
        }

    } else if (e.dataTransfer?.items.length === 1) {
        const item = e.dataTransfer.items[0];
        if (ACCEPTED_TYPES.includes(item.type)) {
            const file = item.getAsFile();
            if (file) {
                Operations.add(file, worldCoord.x, worldCoord.y);
            }
        }
    }
    e.preventDefault();
}

export const isDragging = () => dragActive;