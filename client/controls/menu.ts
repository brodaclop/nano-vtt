import { UI } from "../dom";
import { Operations } from "../operations";
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

UI.menu.container.addEventListener('mousemove', e => e.stopPropagation());

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