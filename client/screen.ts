import { isDragging } from "./drag";
import { MapObject } from "./types/map-objects";
import { send } from "./websocket";

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
        const { id, x, y, zoom, angle } = ob;
        const element = ensureElement(id);
        const node = element.node;
        // TODO: revoke the url when node is released?
        if (!node.src) {
            node.src = URL.createObjectURL(ob.data);
            node.style.position = 'absolute';
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
        zoom: 1000,
        data
    };
    objects.push(ob);
    draw();
    send(ob, ['id', 'x', 'y', 'angle', 'zoom', 'data']);
    return ob;
};