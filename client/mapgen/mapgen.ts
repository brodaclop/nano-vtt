import { UI } from "../dom";
import { Operations } from "../operations";
import { Point } from "../utils/point";
import { Viewport } from "../viewport";
import { drawMapAsset, drawTile, MapAssetCategory, MapAssetKey } from "./assets";
import { blend, envelope, Envelope, hslToRgb } from "./colours";
import { perlin } from "./perlin";


export const HUE_ENVELOPE = [
    [0, 0.33],
    [1, 0]
] satisfies Envelope;

export const SAT_ENVELOPE = [
    [0, 0.4],
    [1, 0.1]
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
    paintedObjects: Partial<Record<MapAssetCategory, number>>;
    ctx: CanvasRenderingContext2D;
}

const paintObjects = async (asset: MapAssetCategory, terrain: Array<number>, { ctx, size, paintedObjects }: ScenarioSettings) => {
    const putFn = objectThresholdFn[asset].bind(undefined, terrain);
    const count = paintedObjects[asset] ?? 0;
    let objects: Array<PaintedObject> = [];
    while (objects.length < count) {
        const idx = Math.floor(Math.random() * size ** 2);
        if (putFn(idx)) {
            objects.push({
                x: idx % size,
                y: Math.floor(idx / size),
                //angle: 2 * Math.PI * Math.random(),
                angle: 0,
                scale: 0.5 + Math.random()
            });
        }
    }

    objects.sort((a, z) => a.y - z.y);

    await drawMapAsset(asset, bitmaps => {
        objects.forEach(ob => {
            const assetIdx = Math.floor(Math.random() * bitmaps.length);
            const bitmap = bitmaps[assetIdx];

            ctx.resetTransform();
            ctx.translate(ob.x, ob.y);
            ctx.rotate(ob.angle);
            ctx.scale((Math.random() > 0.5 ? 1 : -1) * ob.scale, ob.scale);
            ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
        });
    });
}

const generatePath = (topX: number, bottomX: number, y: number, breaks: number): Envelope => {
    const ret: [number, number][] = [[-y / 5, topX], [y * 6 / 5, bottomX]];
    for (let i = 0; i < breaks; i++) {
        const breakY = Math.random() * y;
        const breakX = envelope(breakY, ret);
        const breakIdx = ret.findLastIndex(p => p[0] < breakY);
        const ySpan = ret[breakIdx + 1][0] - ret[breakIdx][0];
        ret.splice(breakIdx + 1, 0, [breakY, breakX + (Math.random() - 0.5) * ySpan / 2]);
    }

    return ret;
}



const paintPath = async ({ size, ctx }: ScenarioSettings, terrain: Array<number>) => {
    const pathContext = new OffscreenCanvas(size, size).getContext('2d')!;
    const dirtRoad = await drawTile('DIRTROAD', size);
    const WIDTH = 80;
    const line = async (points: Array<Point>, width: number) => {
        pathContext.strokeStyle = pathContext.createPattern(await createImageBitmap(dirtRoad), 'repeat')!;
        pathContext.lineWidth = width;
        pathContext.beginPath();
        pathContext.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 2) {
            pathContext.quadraticCurveTo(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y)
        }
        pathContext.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        pathContext.stroke();
    };
    const path = generatePath(Math.random() * size, Math.random() * size, size, 15);

    const ALPHA = [
        [0.5, 1],
        [0.7, 0.5],
        [1, 0.2],
    ];
    for (let alpha of ALPHA) {
        pathContext.globalAlpha = alpha[1] / 4;
        await line(path.map(p => Point.fromCoords(p[1], p[0])), WIDTH * alpha[0]);
    }
    pathContext.globalAlpha = 0.01
    await line(path.map(p => Point.fromCoords(p[1], p[0])), WIDTH * 1.5);
    const image = pathContext.getImageData(0, 0, size, size);
    for (let i = 0; i < size * size; i++) {
        if (image.data[i * 4 + 3] > 0) {
            terrain[i] = 256;
        }
    }
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

const objectThresholdFn: Record<MapAssetCategory, (terrain: Array<number>, idx: number) => boolean> = {
    plant: (terrain, idx) => terrain[idx] < 256 && terrain[idx] < 0.4,
    rock: (terrain, idx) => terrain[idx] < 256 && terrain[idx] > 0.6,
    tree: (terrain, idx) => terrain[idx] < 256 && 0.3 < terrain[idx] && 0.7 > terrain[idx]
};

export const generateMap = async (settings: ScenarioSettings) => {

    const terrain = perlin(settings.perlinNodes, settings.size);

    await paintTerrain(terrain, settings);

    await paintPath(settings, terrain);

    for (let asset in settings.paintedObjects) {
        await paintObjects(asset as MapAssetCategory, terrain, settings);
    }
}

UI.mapgen.dialog.addEventListener('mousemove', UI.stopEvent);

let currentCanvas: OffscreenCanvas | undefined = undefined;
UI.mapgen.submitButton.disabled = true;

export const showMapGeneration = () => {
    UI.mapgen.dialog.showModal();
}

const generate = async () => {
    const sizeSelection = Number(UI.mapgen.size.value);
    const busyness = 2 ** (Number(UI.mapgen.busyness.value) + 1);
    const size = 2 ** (sizeSelection + 8);
    const tree = Number(UI.mapgen.tree.value) * 30 * (2 ** sizeSelection);
    const plant = Number(UI.mapgen.plant.value) * 30 * (2 ** sizeSelection);
    const rock = Number(UI.mapgen.rock.value) * 30 * (2 ** sizeSelection);


    const offscreenCanvas = new OffscreenCanvas(size, size);
    const ctx = offscreenCanvas.getContext('2d')!;

    await generateMap({
        ctx: ctx as unknown as CanvasRenderingContext2D,
        size,
        perlinNodes: busyness,
        paintedObjects: {
            rock,
            plant,
            tree
        }
    })
    return offscreenCanvas;

}

UI.mapgen.previewButton.addEventListener('click', async () => {
    currentCanvas = await generate();
    const ctx = UI.mapgen.previewCanvas.getContext('2d')!;
    const scale = ctx.canvas.width / currentCanvas.width;
    ctx.resetTransform();
    ctx.scale(scale, scale);
    ctx.drawImage(currentCanvas, 0, 0);
    UI.mapgen.submitButton.disabled = false;
});


UI.mapgen.form.onsubmit = (e) => {
    if (currentCanvas) {
        UI.mapgen.dialog.close();
        (async () => {
            const coords = Viewport.screen2World({ x: 0, y: 0 });

            await Operations.add(await currentCanvas.convertToBlob(), coords.x, coords.y);

            currentCanvas = undefined;
            UI.mapgen.submitButton.disabled = true;
        })();

    }
    e.preventDefault();
    return false;
};

