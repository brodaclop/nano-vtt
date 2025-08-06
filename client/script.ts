import { deleteObject, draw, getSelectedObject, rotateSelected, zoomSelected } from "./screen";
import { sendDelete } from "./websocket";




console.log('Script loaded');

document.onkeydown = e => {
    const selected = getSelectedObject();
    console.log('key', e.key, selected);
    if (selected) {
        if (e.key === 'Delete') {
            deleteObject(selected.id);
            sendDelete(selected.id);
        }
        if (e.key === '+') {
            zoomSelected(1.1);
        }
        if (e.key === '-') {
            zoomSelected(0.9);
        }
        if (e.key === 'ArrowLeft') {
            rotateSelected(-5);
        }
        if (e.key === 'ArrowRight') {
            rotateSelected(5);
        }
    }
    e.preventDefault();
}

draw();


