import { UI } from "./dom";
import { MapObject } from "./types/map-objects";
interface ScreenElement {
    node: HTMLImageElement;
}

let screenObjects: Record<number, ScreenElement> = {};

const ensureElement = (ob: MapObject, mouseHandlerFor: (ob: MapObject) => (() => void)): ScreenElement => {
    if (!screenObjects[ob.id]) {
        const node = document.createElement("img");
        node.onmousedown = mouseHandlerFor(ob);
        node.src = URL.createObjectURL(ob.data);
        node.style.position = 'absolute';
        UI.canvas.appendChild(node);
        screenObjects[ob.id] = {
            node
        }
    }
    return screenObjects[ob.id];
}

export const drawScreen = (objects: Array<MapObject>, selected: number | undefined, mouseHandlerFor: (ob: MapObject) => (() => void)) => {
    const maxLayer = Math.max(0, ...objects.map(ob => ob.layer).filter(l => l !== 0));
    objects.forEach((ob) => {
        const { id, x, y, zoom, layer, angle, locked } = ob;
        const element = ensureElement(ob, mouseHandlerFor);
        const node = element.node;

        node.style.opacity = (selected && (selected !== id)) ? '0.5' : '0.8';
        node.style.display = (layer === 0) ? 'none' : 'inline-block';
        node.style.zIndex = selected === id ? String(maxLayer + 1) : String(layer);

        node.style.left = '0';
        node.style.top = '0';
        node.style.transform = `translate(${x}px, ${y}px) scale(${zoom / 1000}) rotate(${angle}deg)`;
        const shadowColour = locked ? 'red' : '#E6F41D';
        node.style.boxShadow = selected === id ? `0px 0px 7px 2px ${shadowColour}` : '';
    });
    const deleted = Object.keys(screenObjects).filter(id => objects.every(ob => ob.id !== Number(id))).map(id => Number(id));
    deleted.forEach((id) => {
        const elem = screenObjects[id];
        elem.node.remove();
        delete screenObjects[id];
    });
}

export const scrollIntoView = (ob: MapObject) => {
    const node = screenObjects[ob?.id]?.node;
    if (node) {
        const r = node.getBoundingClientRect();
        const w = window.innerWidth;
        const h = window.innerHeight;

        const visible =
            r.top < h && r.bottom > 0 &&
            r.left < w && r.right > 0
        if (!visible) {
            node.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

export const getObjectSize = (ob: MapObject) => {
    const { node } = screenObjects[ob.id];
    return {
        w: node.naturalWidth,
        h: node.naturalHeight
    }
}