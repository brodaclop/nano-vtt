import { FogCircle, Grid, MapObject } from "./map-objects";

export interface ScreenProvider {
    init: () => Promise<void>;
    getObjectSize: (ob: MapObject) => {
        w: number;
        h: number;
    };
    scrollIntoView: (ob: MapObject) => void;
    draw: (objects: Array<MapObject>, grid: Grid, fog: Array<FogCircle>, selected: number | undefined) => void;
}