import { Events } from "./events";
import { FogCircle, Grid, MapObject, WorldObject } from "./types/map-objects";

let objects: Array<MapObject> = [];
let selected: number | undefined = undefined;
let editMode: 'normal' | 'fog' = 'normal';
let grid: Grid = {
    size: 50,
    strength: 5
};

let fog: Array<FogCircle> = [
    // { origin: { x: 0, y: 0 }, radius: 400, reverted: false },
    // { origin: { x: 400, y: 0 }, radius: 100, reverted: false },
    // { origin: { x: 150, y: 50 }, radius: 100, reverted: true },
    // { origin: { x: 200, y: 0 }, radius: 100, reverted: false },
];

const changeFn = <F extends (...args: any) => any>(fn: F): (...args: Parameters<F>) => Promise<ReturnType<F>> => {
    return async (...args: Parameters<F>) => {
        const ret = fn(...args);
        await Events.emit({ type: 'world-changed' });
        return ret;
    }
}

const select = async (ob?: MapObject) => {
    selected = ob?.id;
    if (ob) {
        await Events.emit({ type: 'object-selected', payload: ob });
    }
}

export const World = {
    get objects(): Array<MapObject> {
        return [...objects];
    },
    get grid(): Grid {
        return { ...grid };
    },
    get selected(): MapObject | undefined {
        return objects.find(ob => ob.id === selected);
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
    change: {
        remove: changeFn((id: number) => {
            objects = objects.filter(ob => ob.id !== id);
            if (selected === id) {
                select();
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
                // TODO: check that every attribute is present
                const fullNewOb = newOb as MapObject;
                objects.push(fullNewOb);
                if (selectNewOb) {
                    await select(fullNewOb);
                }
                return fullNewOb;
            }
        }),
        select: changeFn((ob?: MapObject) => select(ob)),
        selectNext: changeFn(() => {
            if (objects.length > 0) {
                if (selected === undefined) {
                    select(objects[0]);
                } else {
                    const idx = objects.findIndex(ob => ob.id === selected);
                    select(objects[(idx + 1) % objects.length]);
                }
            }
        }),
        selectPrevious: changeFn(() => {
            if (objects.length > 0) {
                if (selected === undefined) {
                    select(objects.at(-1));
                } else if (objects.length > 0) {
                    const idx = objects.findIndex(ob => ob.id === selected);
                    select(objects[(idx - 1 + objects.length) % objects.length]);
                }
            }
        }),
        unselect: changeFn(() => select()),
        setGrid: changeFn((newGrid: Partial<Grid>) => {
            grid = { ...grid, ...newGrid };
            return grid;
        }),
    },
    addFogCircle: changeFn((circle: FogCircle) => {
        fog.push(circle);
    }),
    getEditMode: () => editMode,
    flipEditMode: () => editMode = editMode === 'normal' ? 'fog' : 'normal'
}

Events.register('grid-received', World.change.setGrid);
Events.register('object-delete-received', World.change.remove);
Events.register('object-received', World.change.update);
Events.register('sync-received', changeFn((newWorld: WorldObject) => {
    objects = newWorld.objects;
    grid = newWorld.grid;
}));




