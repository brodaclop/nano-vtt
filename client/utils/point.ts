export interface Point {
    x: number;
    y: number;
}

export const Point = {
    fromCoords: (x: number, y: number): Point => ({ x, y }),
    add: (...points: Array<Point>): Point => points.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 }),
    scale: (p: Point, factor: number): Point => ({ x: p.x * factor, y: p.y * factor }),
    invert: (p: Point): Point => Point.scale(p, -1),
    subtract: (from: Point, what: Point): Point => Point.add(from, Point.invert(what))
};