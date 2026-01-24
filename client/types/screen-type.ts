import { MapObject } from "./map-objects";

export interface ScreenProvider {
    init: () => Promise<void>;
    getObjectSize: (ob: MapObject) => {
        w: number;
        h: number;
    };
    scrollIntoView: (ob: MapObject) => void;
    draw: (objects: Array<MapObject>, selected: number | undefined) => void;
}