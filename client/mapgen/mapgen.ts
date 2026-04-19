import { drawMapAsset, drawTile, MapAssetKey } from "./assets";
import { blend, envelope, Envelope, hslToRgb } from "./colours";
import { perlin } from "./perlin";


export const HUE_ENVELOPE = [
    [0, 0.33],
    [1, 0]
] satisfies Envelope;

export const SAT_ENVELOPE = [
    [0, 0.7],
    [1, 0.2]
] satisfies Envelope;


interface PaintedObject {
    x: number;
    y: number;
    scale: number;
    angle: number;
}

export interface ScenarioSettings {
    size: number;
    perlinNodes: number;
    rocks: number;
    plants: number;
    trees: number;
    ctx: CanvasRenderingContext2D;
}

const paintObjects = async (asset: MapAssetKey, count: number, putFn: (idx: number) => boolean, { ctx, size }: ScenarioSettings) => {
    let objects: Array<PaintedObject> = [];
    while (objects.length < count) {
        const idx = Math.floor(Math.random() * size ** 2);
        if (putFn(idx)) {
            objects.push({
                x: idx % size,
                y: Math.floor(idx / size),
                angle: 2 * Math.PI * Math.random(),
                scale: 0.5 + Math.random()
            });
        }
    }

    objects.sort((a, z) => a.scale - z.scale);

    await drawMapAsset(asset, bitmap => {
        objects.forEach(ob => {
            ctx.resetTransform();
            ctx.translate(ob.x, ob.y);
            ctx.rotate(ob.angle);
            ctx.scale(ob.scale, ob.scale);
            ctx.drawImage(bitmap, 0, 0);
        });
    });
}

const generatePath = (topX: number, bottomX: number, y: number, breaks: number): Envelope => {
    const ret: [number, number][] = [[0, topX], [y, bottomX]];
    for (let i = 0; i < breaks; i++) {
        const breakY = Math.random() * y;
        const breakX = envelope(breakY, ret);
        const breakIdx = ret.findLastIndex(p => p[0] < breakY);
        const ySpan = ret[breakIdx + 1][0] - ret[breakIdx][0];
        ret.splice(breakIdx + 1, 0, [breakY, breakX + (Math.random() - 0.5) * ySpan / 2]);
    }

    return ret;
}

const paintPath = async ({ size, ctx }: ScenarioSettings) => {
    const pathContext = new OffscreenCanvas(size, size).getContext('2d')!;
    const image = pathContext.createImageData(size, size, { colorSpace: 'srgb' });
    const path = generatePath(Math.random() * size, Math.random() * size, size, 15);
    const WIDTH = 30;
    const dirtRoad = await drawTile('DIRTROAD', size);
    for (let i = 0; i < image.data.length; i += 4) {
        const x = (i / 4) % size;
        const y = Math.floor((i / 4) / size);
        const pathX = envelope(y, path);
        if (x >= pathX - WIDTH && x <= pathX + WIDTH) {
            image.data[i + 0] = dirtRoad.data[i + 0];
            image.data[i + 1] = dirtRoad.data[i + 1];
            image.data[i + 2] = dirtRoad.data[i + 2];
            image.data[i + 3] = 255 - Math.abs(x - pathX) * 255 / WIDTH;
        } else {
            image.data[i + 3] = 0;
        }
    }

    pathContext.putImageData(image, 0, 0);
    ctx.drawImage(pathContext.canvas, 0, 0);
}

const paintTerrain = async (terrain: Array<number>, { ctx, size }: ScenarioSettings) => {
    const image = ctx.createImageData(size, size, { colorSpace: 'srgb' });

    const grassImage = await drawTile('GRASS', size);
    const dirtImage = await drawTile('DIRT', size);

    for (let i = 0; i < image.data.length; i += 4) {
        const value = terrain[i / 4];
        const rgb = hslToRgb(envelope(value, HUE_ENVELOPE), envelope(value, SAT_ENVELOPE), 0.5);
        const final = blend(
            { colour: rgb, weight: value },
            { colour: [grassImage.data[i], grassImage.data[i + 1], grassImage.data[i + 2]], weight: (1 - value) ** 3 },
            { colour: [dirtImage.data[i], dirtImage.data[i + 1], dirtImage.data[i + 2]], weight: 1 - (1 - value) ** 3 }
        );
        image.data[i + 0] = final[0];
        image.data[i + 1] = final[1];
        image.data[i + 2] = final[2];
        image.data[i + 3] = 255;
    }

    const bitmap = await createImageBitmap(image);

    ctx.drawImage(bitmap, 0, 0);

}


export const generateMap = async (settings: ScenarioSettings) => {

    const terrain = perlin(settings.perlinNodes, settings.size);

    await paintTerrain(terrain, settings);

    await paintPath(settings);

    await paintObjects('PLANT', settings.plants, idx => Math.random() > terrain[idx] / 2, settings);
    await paintObjects('ROCK', settings.rocks, idx => Math.random() > terrain[idx], settings);
    await paintObjects('TREE', settings.trees, idx => Math.random() < terrain[idx], settings);
}