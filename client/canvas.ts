import { bindInputValue, UI } from "./dom";
import { isDragging } from "./drag";
import { Fog } from "./fog";
import { Point } from "./point";
import { FogCircle, Grid, MapObject } from "./types/map-objects";
import { ScreenProvider } from "./types/screen-type";
import { Viewport } from "./viewport";
import { World } from "./world";

const canvas = document.createElement('canvas');
let ctx: CanvasRenderingContext2D;

const fogSize = bindInputValue(UI.menu.fogSize, 100);


const init = () => {
    setCanvasSize();
    ctx = canvas.getContext('2d')!;
    window.onresize = () => {
        setCanvasSize();
        World.draw();
    };
    canvas.addEventListener('mousedown', e => {
        const screenPoint = new DOMPoint(e.offsetX, e.offsetY);
        if (World.getEditMode() === 'fog' && e.buttons & 3) {
            const worldPoint = Viewport.screen2World(screenPoint);
            World.addFogCircle({
                origin: worldPoint,
                radius: fogSize.value,
                reverted: Boolean(e.buttons & 2)
            })
            e.preventDefault();
            e.stopPropagation();
            return false;
        } else if (!isDragging() && e.button === 0 && !Fog.isScreenPointInFog(screenPoint)) {
            const objects = sortObjects(World.getAll(), World.selected()?.id).toReversed().filter(ob => !ob.locked);
            const clicked = objects.find(ob => {
                const { imageOrigin, imageSize } = transformObjectSpace(ob, images[ob.id]);
                const matrix = ctx.getTransform().inverse();
                const transformedClickPoint = matrix.transformPoint(screenPoint);
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

const setCanvasSize = () => {
    canvas.width = window.visualViewport?.width! - 10;
    canvas.height = window.visualViewport?.height! - 10;
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

const draw = async (objects: MapObject[], grid: Grid, fog: Array<FogCircle>, selected: number | undefined) => {
    clearCanvas();
    drawGrid(grid);
    for (const ob of sortObjects(objects, selected)) {
        const image = await ensureImage(ob);
        const { imageOrigin, imageSize } = await transformObjectSpace(ob, image);
        ctx.globalAlpha = (selected !== undefined && (selected !== ob.id)) ? 0.7 : 0.8;
        ctx.drawImage(image, imageOrigin.x, imageOrigin.y);
        if (selected === ob.id) {
            drawBorder(ob, imageOrigin, imageSize);
        }
    }
    ctx.resetTransform();
    const fogImg = Fog.draw(fog, { x: ctx.canvas.width, y: ctx.canvas.height });
    ctx.globalAlpha = 1;
    ctx.drawImage(fogImg, 0, 0);
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


const transformObjectSpace = (ob: MapObject, image: HTMLImageElement) => {
    const imageSize = Point.fromCoords(image.width, image.height);
    const worldCentre = Point.add(ob, Point.scale(imageSize, 0.5));
    const screenCentre = Viewport.world2Screen(worldCentre);
    const screenScale = Viewport.zoom() * ob.zoom / 1000;
    ctx.resetTransform();
    ctx.translate(screenCentre.x, screenCentre.y);
    ctx.scale(screenScale, screenScale);
    ctx.rotate(ob.angle * Math.PI / 180);
    const imageOrigin = Point.scale(imageSize, -0.5);
    return { image, imageOrigin, imageSize };
}

const clearCanvas = () => {
    ctx.reset();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
}

const drawBorder = (ob: MapObject, imageOrigin: Point, imageSize: Point) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = ob.locked ? 'red' : '#E6F41D';
    ctx.strokeRect(imageOrigin.x, imageOrigin.y, imageSize.x, imageSize.y);
}

const drawGrid = (grid: Grid) => {
    console.log('grid strength', grid.strength, UI.menu.gridStrength.value);
    if (grid.strength > 0) {
        const worldTopLeft = Viewport.screen2World({ x: 0, y: 0 });
        const worldBottomRight = Viewport.screen2World({ x: canvas.width, y: canvas.height });
        let x = Math.ceil(worldTopLeft.x / grid.size) * grid.size;
        while (x < worldBottomRight.x) {
            const start = Viewport.world2Screen({ x, y: worldTopLeft.y });
            const end = Viewport.world2Screen({ x, y: worldBottomRight.y });
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            x += grid.size;
        }
        let y = Math.ceil(worldTopLeft.y / grid.size) * grid.size;
        while (y < worldBottomRight.y) {
            const start = Viewport.world2Screen({ x: worldTopLeft.x, y });
            const end = Viewport.world2Screen({ x: worldBottomRight.x, y });
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            y += grid.size;
        }
        ctx.strokeStyle = 'white';
        ctx.globalAlpha = grid.strength;
        ctx.stroke();
    }
    UI.menu.gridSize.value = String(grid.size);
    UI.menu.gridStrength.value = String(grid.strength);
}

