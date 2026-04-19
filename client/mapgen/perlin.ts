const randomAngle = () => Math.random() * 2 * Math.PI;

const interpolate = (x: number, a: number, b: number) => a + (6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3) * (b - a);

export const perlin = (nodeCount: number, size: number): Array<number> => {
    const nodes = Array((nodeCount + 1) ** 2).fill(null).map(() => randomAngle());

    const value = (nodeX: number, nodeY: number, x: number, y: number) => {
        const gAngle = nodes[nodeY * (nodeCount + 1) + nodeX];
        const gX = Math.cos(gAngle);
        const gY = Math.sin(gAngle);
        const dX = x * nodeCount / size - nodeX;
        const dY = y * nodeCount / size - nodeY;
        return dX * gX + dY * gY;
    }


    const ret = Array(size ** 2).fill(0);


    for (let y = 0; y < size; y++) {
        const previousNodeY = Math.floor(y * nodeCount / size);
        for (let x = 0; x < size; x++) {
            const previousNodeX = Math.floor(x * nodeCount / size);
            const tl = value(previousNodeX, previousNodeY, x, y);
            const tr = value(previousNodeX + 1, previousNodeY, x, y);
            const bl = value(previousNodeX, previousNodeY + 1, x, y);
            const br = value(previousNodeX + 1, previousNodeY + 1, x, y);
            const dX = x * nodeCount / size - previousNodeX;
            const dY = y * nodeCount / size - previousNodeY;
            const xt = interpolate(dX, tl, tr);
            const xb = interpolate(dX, bl, br);
            const v = interpolate(dY, xt, xb);
            ret[y * size + x] = (v + 1) / 2;
        }
    }
    return ret;
}