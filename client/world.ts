import { MapObject } from "./types/map-objects";
import { ScreenProvider } from "./types/screen-type";


let screen: ScreenProvider;

let selected: number | undefined = undefined;

let objects: Array<MapObject> = [];

export const initWorld = async (screenProvider: ScreenProvider) => {
    screen = screenProvider;
    const map = await (await fetch('/assets/alunselkirk.jpg')).blob();
    objects.push({
        id: 0,
        data: map,
        x: 0,
        y: 0,
        layer: 0,
        zoom: 1000,
        locked: 0,
        angle: 0
    });
    World.draw();
}


export const World = {
    selected: (): MapObject | undefined => objects.find(ob => ob.id === selected),
    getAll: () => objects,
    add: (data: Blob, x: number, y: number) => {
        const ob: MapObject = {
            id: Math.round(Math.random() * 1_000_000_000),
            angle: 0,
            x,
            y,
            layer: World.maxLayer() + 1,
            locked: 0,
            zoom: 1000,
            data
        };
        objects.push(ob);
        select(ob);
        World.draw();
        return ob;
    },
    remove: (id: number) => {
        objects = objects.filter(ob => ob.id !== id);
        if (selected === id) {
            select();
        }
        World.draw();
    },
    update: async (newOb: Partial<MapObject>) => {
        const uIdx = objects.findIndex(ob => ob.id === newOb.id);
        if (uIdx !== -1) {
            if (!objects[uIdx].locked || 'locked' in newOb) {
                objects[uIdx] = { ...objects[uIdx], ...newOb };
                await World.draw();
            }
            return objects[uIdx];
        } else {
            // TODO: check that every attribute is present
            objects.push(newOb as MapObject);
            await World.draw();
            return newOb as MapObject;
        }
    },
    replace: (obs: Array<MapObject>) => {
        objects = obs;
        World.draw();
    },
    draw: () => screen.draw(objects, selected),
    maxLayer: () => Math.max(0, ...objects.map(ob => ob.layer).filter(l => l !== 0)),
    minLayer: () => Math.min(Number.MAX_SAFE_INTEGER, ...objects.map(ob => ob.layer).filter(l => l !== 0)),
    select: (ob?: MapObject) => select(ob),
    selectNext: () => {
        if (objects.length > 0) {
            if (selected === undefined) {
                select(objects[0]);
            } else {
                const idx = objects.findIndex(ob => ob.id === selected);
                select(objects[(idx + 1) % objects.length]);
            }
            World.draw();
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
            World.draw();
        }
    },
    unselect: () => {
        select();
        World.draw();
    },
}



const select = (ob?: MapObject) => {
    selected = ob?.id;
    if (ob) {
        screen.scrollIntoView(ob);
    }
}

