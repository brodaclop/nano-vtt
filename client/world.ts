import { isDragging } from "./drag";
import { MapObject } from "./types/map-objects";
import { sendDelete, sendObject, sendSyncMessage } from "./messages";
import { drawScreen, getObjectSize, scrollIntoView } from "./screen";



let selected: number | undefined = undefined;

let objects: Array<MapObject> = [];

const STARTING_ZINDEX = 100_000_000;

export const initWorld = async () => {
    const map = await (await fetch('/assets/alunselkirk.jpg')).blob();
    objects.push({
        id: 0,
        data: map,
        x: 0,
        y: 0,
        layer: STARTING_ZINDEX,
        zoom: 1000,
        locked: 0,
        angle: 0
    });
    draw();
}


const maxLayer = () => Math.max(0, ...objects.map(ob => ob.layer).filter(l => l !== 0));
const minLayer = () => Math.min(STARTING_ZINDEX, ...objects.map(ob => ob.layer).filter(l => l !== 0));

const draw = () => drawScreen(objects, selected, mouseHandlerFor);

const mouseHandlerFor = (ob: MapObject) => () => {
    if (!isDragging()) {
        if (selected === undefined || selected === ob.id) {
            select(ob);
        } else {
            select();
        }
        draw();
    }
};


export const World = {
    add: (data: Blob, x: number, y: number) => {
        const ob: MapObject = {
            id: Math.round(Math.random() * 1_000_000_000),
            angle: 0,
            x,
            y,
            layer: maxLayer() + 1,
            locked: 0,
            zoom: 1000,
            data
        };
        objects.push(ob);
        select(ob);
        draw();
        return ob;
    },
    remove: (id: number) => {
        objects = objects.filter(ob => ob.id !== id);
        if (selected === id) {
            select();
        }
        draw();
    },
    update: (newOb: Partial<MapObject>) => {
        const uIdx = objects.findIndex(ob => ob.id === newOb.id);
        if (uIdx !== -1) {
            if (!objects[uIdx].locked || 'locked' in newOb) {
                objects[uIdx] = { ...objects[uIdx], ...newOb };
                draw();
            }
            return objects[uIdx];
        } else {
            // TODO: check that every attribute is present
            objects.push(newOb as MapObject);
            draw();
            return newOb as MapObject;
        }
    },
    replace: (obs: Array<MapObject>) => {
        objects = obs;
        draw();
    }
}

const update = (change: Partial<MapObject>) => {
    const ob = World.update(change);
    const fields = Object.keys(change) as Array<keyof MapObject>;
    sendObject(ob, fields);
}

const select = (ob?: MapObject) => {
    selected = ob?.id;
    if (ob) {
        scrollIntoView(ob);
    }
}

export const Operations = {
    zoom: (zoom: number) => {
        const originalZoom = objects.find(ob => ob.id === selected)?.zoom;
        if (originalZoom !== undefined) {
            update({ id: selected, zoom: originalZoom * zoom })
        }
    },
    rotate: (angle: number) => {
        const originalAngle = objects.find(ob => ob.id === selected)?.angle;
        if (originalAngle !== undefined) {
            update({ id: selected, angle: originalAngle + angle })
        }
    },
    sendToTop: () => {
        if (selected !== undefined) {
            update({ id: selected, layer: maxLayer() + 1 });
        }
    },
    sendToBottom: () => {
        if (selected !== undefined) {
            update({ id: selected, layer: minLayer() - 1 });
        }
    },
    lock: () => {
        if (selected !== undefined) {
            const locked = objects.find(ob => ob.id === selected)!.locked;
            update({ id: selected, locked: Number(!locked) })
        }
    },
    remove: () => {
        if (selected !== undefined) {
            World.remove(selected);
            sendDelete(selected);
        }
    },
    move: (dx: number, dy: number) => {
        const selectedOb = objects.find(ob => ob.id === selected);
        if (selectedOb) {
            const { x, y } = selectedOb;
            const { w, h } = getObjectSize(selectedOb);
            const limitX = (w * selectedOb.zoom / 1000 - w) / 2;
            const limitY = (h * selectedOb.zoom / 1000 - h) / 2;

            update({ id: selected, x: Math.max(limitX, x + dx), y: Math.max(limitY, y + dy) });
        }
    },
    add: (data: Blob, x: number, y: number) => {
        const ob = World.add(data, x, y);
        sendObject(ob);
    },
    selectNext: () => {
        if (objects.length > 0) {
            if (selected === undefined) {
                select(objects[0]);
            } else {
                const idx = objects.findIndex(ob => ob.id === selected);
                select(objects[(idx + 1) % objects.length]);
            }
            draw();

        }
    },
    selectPrevious: () => {
        if (objects.length > 0) {
            if (selected === undefined) {
                select(objects.at(-1));
            } else if (objects.length > 0) {
                const idx = objects.findIndex(ob => ob.id === selected);
                select(objects[(idx - 1 + objects.length) % objects.length]);
            }
            draw();
        }
    },
    unselect: () => {
        select();
        draw();
    },
    sync: () => {
        sendSyncMessage(objects);
    }
}
