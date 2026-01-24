import { UI } from "./dom";
import { isDragging } from "./drag";
import { Point } from "./point";
import { MapObject } from "./types/map-objects";
import { ScreenProvider } from "./types/screen-type";
import { Viewport } from "./viewport";
import { World } from "./world";

let ctx: CanvasRenderingContext2D;

const init = () => {
    const canvas = document.createElement('canvas');
    canvas.width = window.visualViewport?.width!;
    canvas.height = window.visualViewport?.height!;
    ctx = canvas.getContext('2d')!;
    canvas.addEventListener('mousedown', e => {
        if (!isDragging()) {
            const objects = sortObjects(World.getAll(), World.selected()?.id).toReversed();
            const clicked = objects.find(ob => {
                const { imageOrigin, imageSize } = transformObjectSpace(ob, images[ob.id]);
                const matrix = ctx.getTransform().inverse();
                const transformedClickPoint = matrix.transformPoint(new DOMPoint(e.offsetX, e.offsetY));
                const endX = imageOrigin.x + imageSize.x;
                const endY = imageOrigin.y + imageSize.y;
                return imageOrigin.x <= transformedClickPoint.x && endX > transformedClickPoint.x && imageOrigin.y <= transformedClickPoint.y && endY > transformedClickPoint.y;
            });
            World.select(clicked);
            World.draw();

        }
    });
    UI.canvas.appendChild(canvas);
    return Promise.resolve();
}

const images: Record<number, HTMLImageElement> = {};

const ensureImage = async (ob: MapObject): Promise<HTMLImageElement> => {
    if (!images[ob.id]) {
        const image = new Image();
        image.src = URL.createObjectURL(ob.data);
        images[ob.id] = image;
        await new Promise((resolve) => image.onload = resolve)
    }
    return images[ob.id];
}

const draw = async (objects: MapObject[], selected: number | undefined) => {
    ctx.reset();
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    for (const ob of sortObjects(objects, selected)) {
        const image = await ensureImage(ob);
        const { imageOrigin, imageSize } = await transformObjectSpace(ob, image, selected);
        ctx.drawImage(image, imageOrigin.x, imageOrigin.y);
        if (selected === ob.id) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = ob.locked ? 'red' : '#E6F41D';
            ctx.strokeRect(imageOrigin.x, imageOrigin.y, imageSize.x, imageSize.y);
        }
    }
}


export const Canvas: ScreenProvider = {
    init,
    draw,
    getObjectSize: () => ({ h: 1000, w: 1000 }),
    scrollIntoView: () => { }
}

const sortObjects = (objects: MapObject[], selected: number | undefined): MapObject[] => objects.toSorted((a, z) => {
    if (a.id === selected) {
        return -1;
    }
    if (z.id === selected) {
        return 1;
    }
    return z.layer - a.layer;
}).toReversed();


const transformObjectSpace = (ob: MapObject, image: HTMLImageElement, selected?: number) => {
    const imageSize = Point.fromCoords(image.width, image.height);
    const worldCentre = Point.add(ob, Point.scale(imageSize, 0.5));
    const screenCentre = Viewport.world2Screen(worldCentre);
    const screenScale = Viewport.zoom() * ob.zoom / 1000;
    ctx.resetTransform();
    ctx.globalAlpha = (selected !== undefined && (selected !== ob.id)) ? 0.5 : 0.8;
    ctx.translate(screenCentre.x, screenCentre.y);
    ctx.scale(screenScale, screenScale);
    ctx.rotate(ob.angle * Math.PI / 180);
    const imageOrigin = Point.scale(imageSize, -0.5);
    return { image, imageOrigin, imageSize };
}
/*
const selectFn = (ob: MapObject) => () => {
    if (!isDragging()) {
        if (selected === undefined || selected === ob.id) {
            select(ob);
        } else {
            select();
        }
        World.draw();
    }
};
*/