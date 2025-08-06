import { isDragging } from "./drag";
import { MapObject } from "./types/map-objects";
import { sendDelete, sendObject } from "./websocket";

interface ScreenElement {
    node: HTMLImageElement;

}

let selected: number | undefined = undefined;

const canvas = document.getElementById('canvas')!;

let objects: Array<MapObject> = [];


const init = async () => {
    const map = await (await fetch('/assets/alunselkirk.jpg')).blob();
    objects.push({
        id: 0,
        data: map,
        x: 0,
        y: 0,
        layer: 1,
        zoom: 1000,
        angle: 0
    })
}

await init();


const screenObjects: Record<number, ScreenElement> = {};

const ensureElement = (id: number): ScreenElement => {
    if (!screenObjects[id]) {
        const node = document.createElement("img");
        canvas?.appendChild(node);
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

        if (layer === 0) {
            node.style.display = 'none'
        } else {
            node.style.display = 'inline-block';
        }

        node.style.left = '0';
        node.style.top = '0';
        node.style.transform = `translate(${x}px, ${y}px) scale(${zoom / 1000}) rotate(${angle}deg)`;
        node.style.boxShadow = selected === id ? '0px 0px 7px 2px #E6F41D' : '';
        node.onmousedown = (e) => {
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

export const updateObject = (newOb: Partial<MapObject>) => {
    const uIdx = objects.findIndex(ob => ob.id === newOb.id);
    if (uIdx !== -1) {
        objects[uIdx] = { ...objects[uIdx], ...newOb };
    } else {
        // TODO: check that every attribute is present
        objects.push(newOb as MapObject);
    }

    draw();
}

export const getSelectedObject = () => objects.find(ob => ob.id === selected);

export const addObject = (data: Blob) => {
    const ob: MapObject = {
        id: Math.round(Math.random() * 1_000_000_000),
        angle: 0,
        x: 0,
        y: 0,
        layer: 1,
        zoom: 1000,
        data
    };
    objects.push(ob);
    draw();
    sendObject(ob);
    return ob;
};

export const deleteObject = (id: number) => {
    objects = objects.filter(ob => ob.id !== id);
    const elem = screenObjects[id];
    if (elem) {
        canvas.removeChild(elem.node);
        delete screenObjects[id];
    }
    if (selected === id) {
        selected = undefined;
    }
    draw();
}

export const zoomSelected = (zoom: number) => {
    const selected = getSelectedObject();
    if (selected) {
        selected.zoom *= zoom;
        draw();
        sendObject(selected, ['zoom']);
    }
}

export const rotateSelected = (angle: number) => {
    const selected = getSelectedObject();
    if (selected) {
        selected.angle += angle;
        draw();
        sendObject(selected, ['angle']);
    }

}