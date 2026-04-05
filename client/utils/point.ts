export interface Point {
    x: number;
    y: number;
}

export const Point = {
    fromCoords: (x: number, y: number): Point => ({ x, y }),
    add: (...points: Array<Point>): Point => points.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 }),
    scale: (p: Point, factor: number): Point => ({ x: p.x * factor, y: p.y * factor }),
    invert: (p: Point): Point => Point.scale(p, -1),
    subtract: (from: Point, what: Point): Point => Point.add(from, Point.invert(what)),
    rotate: (p: Point, angle: number) => {
        const newX = p.x * Math.cos(angle * Math.PI / 180) - p.y * Math.sin(angle * Math.PI / 180);
        const newY = p.x * Math.sin(angle * Math.PI / 180) + p.y * Math.cos(angle * Math.PI / 180);
        return { x: newX, y: newY };
    },
    isInside: (p: Point, polygon: Array<Point>) => {
        const onRight = (l1: Point, l2: Point) => (l2.x - l1.x) * (p.y - l1.y) - (p.x - l1.x) * (l2.y - l1.y) <= 0;

        return polygon.every((pi, i) => onRight(pi, polygon[(i + 1) % polygon.length]));
    }
};