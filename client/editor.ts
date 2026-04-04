import { Events } from "./events";
import { MapObject } from "./types/map-objects";
import { Point } from "./utils/point";
import { changeFn } from "./world";

export type EditMode = 'normal' | 'fog';
export interface Ruler {
    start: Point,
    end: Point
}

let selected: number | undefined = undefined;
let editMode: EditMode = 'normal';
let ruler: Ruler | undefined;

export const Editor = {
    get editMode(): EditMode {
        return editMode;
    },
    get ruler(): Ruler | undefined {
        return ruler;
    },
    get selected(): number | undefined {
        return selected;
    },
    isSelected: (ob?: MapObject | number) => selected === (typeof ob === 'number' ? ob : ob?.id),
    select: async (ob?: MapObject) => {
        selected = ob?.id;
        if (ob) {
            await Events.emit({ type: 'object-selected', payload: ob });
        }
    },
    flipEditMode: async () => {
        editMode = editMode === 'normal' ? 'fog' : 'normal';
        selected = undefined;
        await Events.emit({ type: 'edit-mode-changed', payload: editMode });
        await Events.emit({ type: 'world-changed' });
    },
    startRuler: async (p: Point) => {
        ruler = {
            start: p,
            end: p
        };
        await Events.emit({ type: 'world-changed' });
    },
    endRuler: async (p: Point) => {
        if (ruler) {
            ruler.end = p
        }
        await Events.emit({ type: 'world-changed' });
    },
    cancelRuler: async () => {
        ruler = undefined;
        await Events.emit({ type: 'world-changed' });
    },
}