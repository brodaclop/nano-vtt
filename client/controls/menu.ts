import { UI } from "../dom";
import { Events } from "../events";
import { Operations } from "../operations";
import { Room } from "../room";
import { World } from "../world";

UI.menu.syncButton.addEventListener('click', () => {
    Operations.sync();
});

UI.menu.openchat.addEventListener('click', () => {
    const isHidden = UI.chat.container.classList.contains('hidden');
    if (isHidden) {
        UI.chat.container.classList.remove('hidden');
    } else {
        UI.chat.container.classList.add('hidden');
    }
});

UI.menu.gridSize.addEventListener('change', () => {
    Operations.setGridSize(Number(UI.menu.gridSize.value));
});

UI.menu.gridStrength.addEventListener('change', () => {
    Operations.setGridStrength(Number(UI.menu.gridStrength.value));
});

UI.menu.container.addEventListener('mousemove', UI.stopEvent);

UI.menu.editFog.addEventListener('click', () => {
    World.flipEditMode();
    UI.menu.editFog.innerText = World.getEditMode() === 'normal' ? 'Edit fog' : 'Finish fog editing';
    const showControls = World.getEditMode() === 'fog';
    if (showControls) {
        UI.menu.fogControls.classList.remove('hidden');
    } else {
        UI.menu.fogControls.classList.add('hidden');
    }
    Operations.unselect();
});

Events.register('socket-status-changed', status => {
    UI.menu.connection.innerText = status === 'connected' ? '' : status;
    UI.menu.connection.style.display = (status === 'connected') ? 'none' : 'inline';
    UI.menu.connected.style.display = (status !== 'connected') ? 'none' : 'inline';
});

Events.register('room-changed', users => {
    UI.menu.room.innerText = `${Room.roomName} (${users.length} users)`;
    UI.menu.room.title = `Users:\n\n${users.map(Room.userName).join('\n')}`;
    UI.menu.name.innerText = Room.userName(Room.me);
})