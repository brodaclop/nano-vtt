import { UI } from "./dom";
import { isDragging } from "./drag";
import { MapObject } from "./types/map-objects";
import { sendDelete, sendObject, sendSyncMessage } from "./messages";

interface ScreenElement {
    node: HTMLImageElement;
}

let selected: number | undefined = undefined;

let objects: Array<MapObject> = [];

const STARTING_ZINDEX = 100_000_000;

const init = async () => {
    const map = await (await fetch('/assets/alunselkirk.jpg')).blob();
    objects.push({
        id: 0,
        data: map,
        x: 0,
        y: 0,
        layer: STARTING_ZINDEX,
        zoom: 1000,
        angle: 0
    });
    UI.menu.syncButton.onclick = () => {
        Operations.sync();
    }
}

await init();


let screenObjects: Record<number, ScreenElement> = {};

const ensureElement = (id: number): ScreenElement => {
    if (!screenObjects[id]) {
        const node = document.createElement("img");
        UI.canvas.appendChild(node);
        screenObjects[id] = {
            node
        }
    }
    return screenObjects[id];
}

export const draw = () => {
    objects.forEach((ob) => {
        const { id, x, y, zoom, layer, angle } = ob;
        const element = ensureElement(id);
        const node = element.node;
        // TODO: revoke the url when node is released?
        if (!node.src) {
            node.src = URL.createObjectURL(ob.data);
            node.style.position = 'absolute';
        }

        node.style.opacity = (selected && (selected !== id)) ? '0.5' : '1';
        node.style.display = (layer === 0) ? 'none' : 'inline-block';
        node.style.zIndex = selected === id ? String(maxLayer() + 1) : String(layer);


        node.style.left = '0';
        node.style.top = '0';
        node.style.transform = `translate(${x}px, ${y}px) scale(${zoom / 1000}) rotate(${angle}deg)`;
        node.style.boxShadow = selected === id ? '0px 0px 7px 2px #E6F41D' : '';
        node.onmousedown = () => {
            if (!isDragging()) {
                if (selected === undefined || selected === id) {
                    selected = id;
                } else {
                    selected = undefined;
                }
                draw();
            }
        };
    });
}

const maxLayer = () => Math.max(STARTING_ZINDEX, ...objects.map(ob => ob.layer).filter(l => l !== 0));
const minLayer = () => Math.min(STARTING_ZINDEX, ...objects.map(ob => ob.layer).filter(l => l !== 0));

export const MapObjects = {
    selected: () => objects.find(ob => ob.id === selected),
    add: (data: Blob, x: number, y: number) => {
        const ob: MapObject = {
            id: Math.round(Math.random() * 1_000_000_000),
            angle: 0,
            x,
            y,
            layer: maxLayer() + 1,
            zoom: 1000,
            data
        };
        objects.push(ob);
        draw();
        return ob;
    },
    remove: (id: number) => {
        objects = objects.filter(ob => ob.id !== id);
        const elem = screenObjects[id];
        if (elem) {
            UI.canvas.removeChild(elem.node);
            delete screenObjects[id];
        }
        if (selected === id) {
            selected = undefined;
        }
        draw();
    },
    update: (newOb: Partial<MapObject>) => {
        const uIdx = objects.findIndex(ob => ob.id === newOb.id);
        if (uIdx !== -1) {
            objects[uIdx] = { ...objects[uIdx], ...newOb };
            draw();
            return objects[uIdx];
        } else {
            // TODO: check that every attribute is present
            objects.push(newOb as MapObject);
            draw();
            return newOb as MapObject;
        }
    },
    replace: (obs: Array<MapObject>) => {
        Object.values(screenObjects).forEach(e => UI.canvas.removeChild(e.node));
        screenObjects = {};
        objects = obs;
        draw();
    }
}

const update = (change: Partial<MapObject>) => {
    const ob = MapObjects.update(change);
    const fields = Object.keys(change) as Array<keyof MapObject>;
    sendObject(ob, fields);
}

export const Operations = {
    zoom: (zoom: number) => {
        const originalZoom = MapObjects.selected()?.zoom;
        if (originalZoom !== undefined) {
            update({ id: selected, zoom: originalZoom * zoom })
        }
    },
    rotate: (angle: number) => {
        const originalAngle = MapObjects.selected()?.angle;
        if (originalAngle !== undefined) {
            update({ id: selected, angle: originalAngle + angle })
        }
    },
    sendToTop: () => {
        if (selected) {
            update({ id: selected, layer: maxLayer() + 1 });
        }
    },
    sendToBottom: () => {
        if (selected) {
            update({ id: selected, layer: minLayer() - 1 });
        }
    },
    remove: () => {
        if (selected) {
            MapObjects.remove(selected);
            sendDelete(selected);
        }
    },
    move: (dx: number, dy: number) => {
        const x = MapObjects.selected()?.x;
        const y = MapObjects.selected()?.y;
        if (x !== undefined && y !== undefined) {
            update({ id: selected, x: x + dx, y: y + dy });
        }
    },
    add: (data: Blob, x: number, y: number) => {
        const ob = MapObjects.add(data, x, y);
        sendObject(ob);
    },
    selectNext: () => {
        if (selected === undefined) {
            selected = objects[0]?.id;
        } else if (objects.length > 0) {
            const idx = objects.findIndex(ob => ob.id === selected);
            selected = objects[(idx + 1) % objects.length].id;
        }
        draw();
    },
    selectPrevious: () => {
        if (selected === undefined) {
            selected = objects[0]?.id;
        } else if (objects.length > 0) {
            const idx = objects.findIndex(ob => ob.id === selected);
            selected = objects[(idx - 1 + objects.length) % objects.length].id;
        }
        draw();
    },
    unselect: () => {
        selected = undefined;
        draw();
    },
    sync: () => {
        sendSyncMessage(objects);
    }
}
