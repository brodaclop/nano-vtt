import { UI } from "../dom";
import { Editor } from "../editor";
import { Events } from "../events";
import { generateMap, showMapGeneration } from "../mapgen/mapgen";
import { Operations } from "../operations";
import { Room } from "../room";
import { Viewport } from "../viewport";
import { World } from "../world";

UI.menu.syncButton.addEventListener('click', () => {
    Operations.sync();
});

UI.menu.openchat.addEventListener('click', () => {
    UI.chat.main.classList.remove('hidden');
    UI.menu.openchat.classList.add('hidden');
    if (UI.plugin.main.classList.contains('hidden') && UI.chat.main.classList.contains('hidden')) {
        UI.sidebar.classList.add('hidden');
    } else {
        UI.sidebar.classList.remove('hidden');
    }
});

UI.menu.openplugin.addEventListener('click', () => {
    UI.plugin.main.classList.remove('hidden');
    UI.menu.openplugin.classList.add('hidden');
    if (UI.plugin.main.classList.contains('hidden') && UI.chat.main.classList.contains('hidden')) {
        UI.sidebar.classList.add('hidden');
    } else {
        UI.sidebar.classList.remove('hidden');
    }
});

UI.plugin.close.addEventListener('click', () => {
    UI.plugin.main.classList.add('hidden');
    UI.menu.openplugin.classList.remove('hidden');
    if (UI.plugin.main.classList.contains('hidden') && UI.chat.main.classList.contains('hidden')) {
        UI.sidebar.classList.add('hidden');
    } else {
        UI.sidebar.classList.remove('hidden');
    }
});

UI.chat.close.addEventListener('click', () => {
    UI.chat.main.classList.add('hidden');
    UI.menu.openchat.classList.remove('hidden');
    if (UI.plugin.main.classList.contains('hidden') && UI.chat.main.classList.contains('hidden')) {
        UI.sidebar.classList.add('hidden');
    } else {
        UI.sidebar.classList.remove('hidden');
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
    Editor.flipEditMode();
    UI.menu.editFog.blur();
});

UI.menu.generateMap.addEventListener('click', showMapGeneration);

Events.register('edit-mode-changed', editMode => {
    UI.menu.editFog.innerText = editMode === 'normal' ? 'Edit fog' : 'Finish fog editing';
    const showControls = editMode === 'fog';
    if (showControls) {
        UI.menu.fogControls.classList.remove('hidden');
    } else {
        UI.menu.fogControls.classList.add('hidden');
    }
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