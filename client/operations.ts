import { Send } from "./messages";
import { Point } from "./utils/point";
import { MapObject } from "./types/map-objects";
import { Viewport } from "./viewport";
import { World } from "./world";

export const Operations = {
    zoom: (zoom: number, forceViewport = false) => {
        if (World.selected && !forceViewport) {
            const originalZoom = World.selected.zoom;
            update({ zoom: originalZoom * zoom })
        } else {
            Viewport.adjustZoom(zoom);
        }
    },
    rotate: (angle: number) => {
        const originalAngle = World.selected?.angle;
        if (originalAngle !== undefined) {
            update({ angle: originalAngle + angle })
        }
    },
    sendToTop: () => {
        update({ layer: World.layers.max + 1 });
    },
    sendToBottom: () => {
        update({ layer: World.layers.min - 1 });
    },
    lock: async () => {
        const locked = World.selected?.locked;
        await update({ locked: Number(!locked) });
        if (!locked) {
            World.change.select();
        }
    },
    remove: () => {
        const selected = World.selected;
        if (selected !== undefined) {
            World.change.remove(selected.id);
            Send.delete(selected.id);
        }
    },
    move: (delta: Point) => {
        const selectedOb = World.selected;
        if (selectedOb) {
            const { x, y } = selectedOb;
            update({ x: x + delta.x, y: y + delta.y });
        }
    },
    add: async (sourceData: Blob, x: number, y: number) => {
        const data = new Blob([await sourceData.bytes()]);
        const ob: MapObject = {
            id: Math.round(Math.random() * 1_000_000_000),
            angle: 0,
            x,
            y,
            layer: World.layers.max + 1,
            locked: 0,
            zoom: 1000,
            data
        };
        await World.change.update(ob, true);
        Send.object(ob);
    },
    selectNext: () => {
        World.change.selectNext();
    },
    selectPrevious: () => {
        World.change.selectPrevious();
    },
    unselect: () => {
        World.change.unselect();
    },
    sync: () => {
        Send.sync(World);
    },
    setGridSize: async (size: number) => {
        const grid = await World.change.setGrid({ size });
        Send.grid(grid);
    },
    setGridStrength: async (strength: number) => {
        const grid = await World.change.setGrid({ strength });
        Send.grid(grid);
    }
}

const update = async (change: Partial<Omit<MapObject, 'id'>>) => {
    const selected = World.selected;
    if (selected) {
        const ob = await World.change.update({ ...change, id: selected.id });
        const fields = Object.keys(change) as Array<keyof MapObject>;
        Send.object(ob, fields);
    }
}