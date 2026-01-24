import { Canvas } from "./canvas";
import { initChat } from "./chat";
import { UI } from "./dom";
import { initDrag } from "./drag";
import { initLobby } from "./lobby";
import { Operations } from "./operations";
import { initWorld } from "./world";

console.log('Script loaded');

document.onkeydown = e => {
    if (document.activeElement !== document.body) {
        return;
    }
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
    } else if (e.key === 'Enter') {
        Operations.lock();
    } else {
        return;
    }
    e.preventDefault();
}

await Canvas.init();

initWorld(Canvas);
initDrag();
initChat();
initLobby();

UI.menu.syncButton.onclick = () => {
    Operations.sync();
}


