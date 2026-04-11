import { sortObjects, createObjectTransform } from "../canvas";
import { UI } from "../dom";
import { Editor } from "../editor";
import { Fog } from "../fog";
import { Operations } from "../operations";
import { Room } from "../room";
import { Point } from "../utils/point";
import { Viewport } from "../viewport";
import { World } from "../world";

const ACCEPTED_TYPES: Array<string> = ['image/png', 'image/jpeg', 'image/webp'];


let drag: { x: number, y: number } | undefined = undefined;
let dragActive = false;


UI.canvas.addEventListener('wheel', (e: WheelEvent) => {
    if (!e.altKey && !e.shiftKey && !e.ctrlKey && e.deltaY !== 0) {
        Operations.zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1, Boolean(e.buttons & 4));
        e.preventDefault();
    }
});

let mousePosition: Point;

document.addEventListener('mousemove', (e) => {
    mousePosition = Point.fromCoords(e.clientX, e.clientY);
    const ruler = Editor.editMode === 'normal' && e.buttons & 2;
    const moveObject = Editor.editMode === 'normal' && e.buttons & 1 && !Editor.isSelected();
    const panScreen = e.buttons & 4 || (Editor.editMode === 'normal' && e.buttons & 1 && Editor.isSelected());
    if (ruler) {
        const point = Viewport.screen2World(mousePosition);
        if (Editor.ruler) {
            Editor.endRuler(point);
        } else {
            Editor.startRuler(point);
        }
    } else if (moveObject || panScreen) {
        const oldDrag = drag;
        drag = Point.fromCoords(e.clientX, e.clientY);
        if (oldDrag) {
            const delta = Point.fromCoords(drag.x - oldDrag.x, drag.y - oldDrag.y);
            if (moveObject) {
                Operations.move(Point.scale(delta, 1 / Viewport.zoom()));
            } else {
                Viewport.moveOrigin(delta);
            }
        } else {
            dragActive = true;
        }

    }

    e.preventDefault();
});

document.addEventListener('mouseup', (e) => {
    if (Editor.ruler) {
        Editor.cancelRuler();
        return false;
    }
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
    if (addDroppedObject(Point.fromCoords(e.clientX, e.clientY), e.dataTransfer)) {
        e.preventDefault();
    }
    e.preventDefault();
});

document.addEventListener('paste', e => {
    if (mousePosition && document.elementFromPoint(mousePosition.x, mousePosition.y) === UI.canvas) {
        const mouseScreenCoords = Point.add(mousePosition, Point.scale(UI.canvasContainer.getBoundingClientRect(), -1));
        if (addDroppedObject(mouseScreenCoords, e.clipboardData)) {
            e.preventDefault();
        }
    }
});

UI.sidebar.addEventListener('mousemove', e => e.stopPropagation());


const addDroppedObject = (mouseScreenCoords: Point, dataTransfer: DataTransfer | null) => {
    const worldCoord = Viewport.screen2World(mouseScreenCoords);
    [...dataTransfer?.items ?? []].forEach(item => {
        if (ACCEPTED_TYPES.includes(item.type)) {
            const file = item.getAsFile();
            if (file) {
                Operations.add(file, worldCoord.x, worldCoord.y);
                return true;
            }
        }
    });
    return false;
}

const fogSize = UI.bindInputValue(UI.menu.fogSize, 100);

UI.canvas.addEventListener('mousedown', e => {
    const screenPoint = new DOMPoint(e.offsetX, e.offsetY);
    if (Editor.editMode === 'fog' && e.buttons & 3) {
        const worldPoint = Viewport.screen2World(screenPoint);
        Operations.addFogCircle({
            originX: worldPoint.x,
            originY: worldPoint.y,
            radius: fogSize.value,
            reverted: Number(Boolean(e.buttons & 2)),
            owner: Room.me
        });
        e.preventDefault();
        e.stopPropagation();
        return false;
    } else if (!dragActive && e.buttons & 1 && !Fog.isScreenPointInFog(screenPoint)) {
        const objects = sortObjects(World.objects).toReversed().filter(ob => !ob.locked);
        const clicked = objects.find(ob => {
            const { width, height } = ob.image;
            const matrix = createObjectTransform(ob).inverse();
            const transformedClickPoint = matrix.transformPoint(screenPoint);
            return Math.abs(transformedClickPoint.x) <= width / 2 && Math.abs(transformedClickPoint.y) <= height / 2;
        });
        Editor.select(clicked);
    } else if (!dragActive && e.buttons & 2) {
        Editor.select();
    }
});
UI.canvas.addEventListener('contextmenu', e => e.preventDefault());

