import { drawMapAsset, MapAssetKey } from "./assets";
import { envelope, Envelope, hslToRgb } from "./colours";
import { perlin } from "./perlin";


const HUE_ENVELOPE = [
    [0, 0.33],
    [1, 0]
] satisfies Envelope;

const SAT_ENVELOPE = [
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

const paintTerrain = (terrain: Array<number>, { ctx, size }: ScenarioSettings) => {
    const image = ctx.createImageData(size, size, { colorSpace: 'srgb' });


    for (let i = 0; i < image.data.length; i += 4) {
        const value = terrain[i / 4];
        const rgb = hslToRgb(envelope(value, HUE_ENVELOPE), envelope(value, SAT_ENVELOPE), 0.5);
        image.data[i + 0] = rgb[0];
        image.data[i + 1] = rgb[1];
        image.data[i + 2] = rgb[2];

        image.data[i + 3] = 255;
    }

    ctx.putImageData(image, 0, 0);
}


export const generateMap = async (settings: ScenarioSettings) => {

    const terrain = perlin(settings.perlinNodes, settings.size);

    paintTerrain(terrain, settings);

    await paintObjects('PLANT', settings.plants, idx => Math.random() > terrain[idx] / 2, settings);
    await paintObjects('ROCK', settings.rocks, idx => Math.random() > terrain[idx], settings);
    await paintObjects('TREE', settings.trees, idx => Math.random() < terrain[idx], settings);
}