import { Editor } from "./editor";
import { Events } from "./events";
import { FogCircle, Grid, MapObject, RawMapObject, WorldObject } from "./types/map-objects";

let objects: Array<MapObject> = [];
let grid: Grid = {
    size: 50,
    strength: 5
};
let fog: Array<FogCircle> = [];


const extendWithImage = async (ob: RawMapObject) => {
    const image = new Image();
    image.src = URL.createObjectURL(ob.data);
    await new Promise((resolve) => image.onload = resolve)
    return { ...ob, image };
}

const changeFn = <F extends (...args: any) => any>(fn: F): (...args: Parameters<F>) => Promise<ReturnType<F>> => {
    return async (...args: Parameters<F>) => {
        const ret = await fn(...args);
        await Events.emit({ type: 'world-changed' });
        return ret;
    }
}

export const World = {
    get objects() {
        return [...objects];
    },
    get grid(): Grid {
        return { ...grid };
    },
    get layers(): { min: number, max: number } {
        let ret: { min: number, max: number } | undefined;
        objects.forEach(ob => {
            if (!ret) {
                ret = { min: ob.layer, max: ob.layer };
            } else {
                ret.min = Math.min(ret.min, ob.layer);
                ret.max = Math.max(ret.max, ob.layer);
            }
        });
        return ret ?? { min: 0, max: 0 };
    },
    get fog() {
        return fog;
    },
    get selectedObject() {
        return objects.find(ob => ob.id === Editor.selected);
    },
    change: {
        remove: changeFn(async (id: number) => {
            objects = objects.filter(ob => ob.id !== id);
            if (Editor.isSelected(id)) {
                await Editor.select();
            }
        }),
        update: changeFn(async (newOb: Partial<MapObject>, selectNewOb = false) => {
            const uIdx = objects.findIndex(ob => ob.id === newOb.id);
            if (uIdx !== -1) {
                if (!objects[uIdx].locked || 'locked' in newOb) {
                    objects[uIdx] = { ...objects[uIdx], ...newOb };
                }
                return objects[uIdx];
            } else {
                if (isObjectComplete(newOb)) {
                    objects.push(await extendWithImage(newOb));

                    if (selectNewOb) {
                        await Editor.select(newOb);
                    }
                    return newOb;
                } else {
                    console.trace('This object is incomplete', newOb);
                    throw new Error('Object incomplete');
                }
            }
        }),
        selectNext: async () => {
            if (objects.length > 0) {
                if (Editor.isSelected()) {
                    await Editor.select(objects[0]);
                } else {
                    const idx = objects.findIndex(Editor.isSelected);
                    await Editor.select(objects[(idx + 1) % objects.length]);
                }
            }
        },
        selectPrevious: async () => {
            if (objects.length > 0) {
                if (Editor.isSelected()) {
                    await Editor.select(objects.at(-1));
                } else if (objects.length > 0) {
                    const idx = objects.findIndex(Editor.isSelected);
                    await Editor.select(objects[(idx - 1 + objects.length) % objects.length]);
                }
            }
        },
        setGrid: changeFn((newGrid: Partial<Grid>) => {
            grid = { ...grid, ...newGrid };
            return grid;
        }),
        addFogCircle: changeFn((circle: FogCircle) => {
            fog.push(circle);
        }),
    },
}


Events.register('grid-received', World.change.setGrid);
Events.register('object-delete-received', World.change.remove);
Events.register('object-received', World.change.update);
Events.register('sync-received', changeFn(async (newWorld: WorldObject) => {
    objects = await Promise.all(newWorld.objects.map(extendWithImage));
    grid = newWorld.grid;
    fog = newWorld.fog;
}));
Events.register('fog-circle-received', async (fogCircle: FogCircle) => {
    await World.change.addFogCircle(fogCircle);
});

const isObjectComplete = (ob: Partial<MapObject>): ob is MapObject => {
    const fields: Array<keyof MapObject> = [
        'angle',
        'data',
        'id',
        'layer',
        'locked',
        'x',
        'y',
        'zoom'
    ];
    return fields.every(field => ob[field] !== undefined);
}


