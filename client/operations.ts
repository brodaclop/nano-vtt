import { sendDelete, sendObject, sendSyncMessage } from "./messages";
import { Point } from "./point";
import { MapObject } from "./types/map-objects";
import { Viewport } from "./viewport";
import { World } from "./world";

export const Operations = {
    zoom: (zoom: number) => {
        const originalZoom = World.selected()?.zoom;
        if (originalZoom !== undefined) {
            update({ zoom: originalZoom * zoom })
        } else {
            Viewport.adjustZoom(zoom);
            World.draw();
        }
    },
    rotate: (angle: number) => {
        const originalAngle = World.selected()?.angle;
        if (originalAngle !== undefined) {
            update({ angle: originalAngle + angle })
        }
    },
    sendToTop: () => {
        update({ layer: World.maxLayer() + 1 });
    },
    sendToBottom: () => {
        update({ layer: World.minLayer() - 1 });
    },
    lock: () => {
        const locked = World.selected()?.locked;
        update({ locked: Number(!locked) })
    },
    remove: () => {
        const selected = World.selected();
        if (selected !== undefined) {
            World.remove(selected.id);
            sendDelete(selected.id);
        }
    },
    move: (delta: Point) => {
        const selectedOb = World.selected();
        if (selectedOb) {
            const { x, y } = selectedOb;
            const limitX = -1000000;
            const limitY = -1000000;

            update({ x: Math.max(limitX, x + delta.x), y: Math.max(limitY, y + delta.y) });
        }
    },
    add: (data: Blob, x: number, y: number) => {
        const ob = World.add(data, x, y);
        sendObject(ob);
    },
    selectNext: () => {
        World.selectNext();
    },
    selectPrevious: () => {
        World.selectPrevious();
    },
    unselect: () => {
        World.unselect();
    },
    sync: () => {
        sendSyncMessage(World.getAll());
    }
}

const update = (change: Partial<Omit<MapObject, 'id'>>) => {
    const selected = World.selected();
    if (selected) {
        const ob = World.update({ ...change, id: selected.id });
        const fields = Object.keys(change) as Array<keyof MapObject>;
        sendObject(ob, fields);
    }
}