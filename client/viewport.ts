import { Point } from "./point";

let zoom: number = 1;
let origin: Point = { x: 0, y: 0 };

export const Viewport = {
    world2Screen: (p: Point): Point => Point.add(origin, Point.scale(p, zoom)),
    screen2World: (p: Point): Point => Point.scale(Point.subtract(p, origin), 1 / zoom),
    zoom: () => zoom,
    origin: () => origin,
    moveOrigin: (delta: Point) => {
        origin = Point.add(origin, delta);
    },
    adjustZoom: (factor: number) => zoom *= factor,
}