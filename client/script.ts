import { initChat } from "./chat";
import { draw, MapObjects, Operations } from "./screen";

console.log('Script loaded');

document.onkeydown = e => {
    console.log('key', e.key, MapObjects.selected());
    if (e.key === 'Delete') {
        Operations.remove();
    } else if (e.key === '+') {
        Operations.zoom(1.1);
    } else if (e.key === '-') {
        Operations.zoom(0.9);
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
    } else {
        return;
    }
    e.preventDefault();
}

initChat();
draw();


