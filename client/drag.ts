import { Operations } from "./screen";

let drag: { x: number, y: number } | undefined = undefined;
let dragActive = false;

document.onmousemove = (e) => {
    if (e.buttons & 1) {
        const oldDrag = drag;
        drag = { x: e.clientX, y: e.clientY };
        if (oldDrag) {
            const delta = { x: drag.x - oldDrag.x, y: drag.y - oldDrag.y };
            Operations.move(delta.x, delta.y);
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

const ACCEPTED_TYPES: Array<string> = ['image/png', 'image/jpeg'];

document.ondrop = e => {
    console.log('dropped');
    if (e.dataTransfer?.items.length === 1) {
        const item = e.dataTransfer.items[0];
        console.log('dropped 1 item, type', item.type);
        if (ACCEPTED_TYPES.includes(item.type)) {
            const file = item.getAsFile();
            console.log('item file', file);
            if (file) {
                Operations.add(file);
            }
        }
    }
    e.preventDefault();
}

export const isDragging = () => dragActive;