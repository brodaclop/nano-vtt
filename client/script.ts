import { Canvas } from "./canvas";
import { Chat, initChat } from "./chat";
import { UI } from "./dom";
import { initDrag } from "./drag";
import { Events } from "./events";
import { initLobby } from "./lobby";
import { Operations } from "./operations";
import { Room } from "./room";
import { initWorld, World } from "./world";

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
    } else {
        return;
    }
    e.preventDefault();
}

document.onwheel = (e: WheelEvent) => {
    if (!e.altKey && !e.shiftKey && !e.ctrlKey && e.deltaY !== 0) {
        Operations.zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
        e.preventDefault();
    }
}

Events.register('world-changed', Canvas.draw);
Events.register('viewport-changed', Canvas.draw);
Events.register('object-selected', Canvas.scrollIntoView);
Events.register('chat-received', Chat.incomingChatMessage);
Events.register('typing-received', Chat.incomingTyping);
Events.register('grid-received', World.change.setGrid);
Events.register('object-delete-received', World.change.remove);
Events.register('object-received', World.change.update);
Events.register('sync-received', World.change.replace);
Events.register('join-received', Room.joined);
Events.register('hello-received', Room.helloed);

await Canvas.init();


initWorld();
initDrag();
initChat();
initLobby();


UI.menu.syncButton.onclick = () => {
    Operations.sync();
}
UI.menu.openchat.onclick = () => {
    const isHidden = UI.chat.container.classList.contains('hidden');
    if (isHidden) {
        UI.chat.container.classList.remove('hidden');
    } else {
        UI.chat.container.classList.add('hidden');
    }
}


UI.menu.gridSize.onchange = () => {
    Operations.setGridSize(Number(UI.menu.gridSize.value));
}

UI.menu.gridStrength.onchange = () => {
    Operations.setGridStrength(Number(UI.menu.gridStrength.value));
}

UI.menu.container.onmousemove = e => e.stopPropagation();

UI.menu.editFog.onclick = () => {
    World.flipEditMode();
    UI.menu.editFog.innerText = World.getEditMode() === 'normal' ? 'Edit fog' : 'Finish fog editing';
    const showControls = World.getEditMode() === 'fog';
    if (showControls) {
        UI.menu.fogControls.classList.remove('hidden');
    } else {
        UI.menu.fogControls.classList.add('hidden');
    }
    Operations.unselect();
}

UI.canvas.addEventListener('contextmenu', e => e.preventDefault());