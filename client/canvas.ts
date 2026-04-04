import { UI } from "./dom";
import { isDragging } from "./controls/mouse";
import { Events } from "./events";
import { Fog } from "./fog";
import { Point } from "./utils/point";
import { FogCircle, Grid, MapObject } from "./types/map-objects";
import { Viewport } from "./viewport";
import { World } from "./world";
import { Room } from "./room";
import { Operations } from "./operations";
import { Editor } from "./editor";

let ctx: CanvasRenderingContext2D;

const images: Record<number, HTMLImageElement> = {};
const fogSize = UI.bindInputValue(UI.menu.fogSize, 100);

const setCanvasSize = () => {
    UI.canvas.width = window.visualViewport?.width! - 10;
    UI.canvas.height = window.visualViewport?.height! - 10;
}

(() => {
    setCanvasSize();
    ctx = UI.canvas.getContext('2d')!;
    window.onresize = () => {
        setCanvasSize();
        Events.emit({ type: 'viewport-changed' });
    };
    UI.canvas.addEventListener('mousedown', e => {
        const screenPoint = new DOMPoint(e.offsetX, e.offsetY);
        if (Editor.editMode === 'fog' && e.buttons & 3) {
            const worldPoint = Viewport.screen2World(screenPoint);
            Operations.addFogCircle({
                originX: worldPoint.x,
                originY: worldPoint.y,
                radius: fogSize.value,
                reverted: Number(Boolean(e.buttons & 2)),
                owner: Room.me
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        } else if (!isDragging() && e.buttons & 1 && !Fog.isScreenPointInFog(screenPoint)) {
            const objects = sortObjects(World.objects).toReversed().filter(ob => !ob.locked);
            const clicked = objects.find(ob => {
                const { imageOrigin, imageSize } = transformObjectSpace(ob, images[ob.id]);
                const matrix = ctx.getTransform().inverse();
                const transformedClickPoint = matrix.transformPoint(screenPoint);
                const endX = imageOrigin.x + imageSize.x;
                const endY = imageOrigin.y + imageSize.y;
                return imageOrigin.x <= transformedClickPoint.x && endX > transformedClickPoint.x && imageOrigin.y <= transformedClickPoint.y && endY > transformedClickPoint.y;
            });
            Editor.select(clicked);
        } else if (!isDragging() && e.buttons & 2) {
            Editor.select();
        }
    });
    UI.canvas.addEventListener('contextmenu', e => e.preventDefault());
})();





const ensureImage = async (ob: MapObject): Promise<HTMLImageElement> => {
    if (!images[ob.id]) {
        const image = new Image();
        image.src = URL.createObjectURL(ob.data);
        images[ob.id] = image;
        await new Promise((resolve) => image.onload = resolve)
    }
    return images[ob.id];
}

const draw = async () => {
    clearCanvas();
    ctx.resetTransform();
    const { objects, grid, fog } = World;
    drawGrid(grid);
    for (const ob of sortObjects(objects)) {
        const image = await ensureImage(ob);
        const { imageOrigin, imageSize } = transformObjectSpace(ob, image);
        ctx.globalAlpha = (!Editor.isSelected() && !Editor.isSelected(ob)) ? 0.7 : 0.8;
        ctx.drawImage(image, imageOrigin.x, imageOrigin.y);
        if (Editor.isSelected(ob)) {
            drawBorder(ob, imageOrigin, imageSize);
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = 'lightgreen';
            ctx.fillRect(imageOrigin.x, imageOrigin.y, imageSize.x, imageSize.y);
        }
    }
    drawRuler(Editor.ruler);
    const fogImg = Fog.draw(fog, { x: ctx.canvas.width, y: ctx.canvas.height });
    ctx.resetTransform();
    ctx.globalAlpha = 1;
    ctx.drawImage(fogImg.other, 0, 0);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(fogImg.own, 0, 0);

}

const sortObjects = (objects: MapObject[]): MapObject[] => objects.toSorted((a, z) => {
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
    ctx.globalAlpha = 1;
    ctx.strokeRect(imageOrigin.x, imageOrigin.y, imageSize.x, imageSize.y);
}

const drawGrid = (grid: Grid) => {
    if (grid.strength > 0) {
        ctx.lineWidth = 1;
        const worldTopLeft = Viewport.screen2World({ x: 0, y: 0 });
        const worldBottomRight = Viewport.screen2World({ x: UI.canvas.width, y: UI.canvas.height });
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
        ctx.globalAlpha = grid.strength / 10;
        ctx.stroke();
        ctx.closePath();
    }
    UI.menu.gridSize.value = String(grid.size);
    UI.menu.gridStrength.value = String(grid.strength);
}

Events.register('object-selected', draw);
const drawRuler = (ruler?: { start: Point, end: Point }) => {
    if (ruler) {
        ctx.beginPath();
        ctx.resetTransform();
        const start = Viewport.world2Screen(ruler.start);
        const end = Viewport.world2Screen(ruler.end);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'darkgoldenrod';
        ctx.lineCap = 'round';
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        const length = Math.floor(Math.sqrt((ruler.start.x - ruler.end.x) * (ruler.start.x - ruler.end.x) + (ruler.start.y - ruler.end.y) * (ruler.start.y - ruler.end.y)));
        ctx.font = "32px Finlandica";
        ctx.fillStyle = 'darkseagreen';
        ctx.fillText(String(length), end.x, end.y);
    }
}

Events.register('edit-mode-changed', mode => {
    UI.canvas.classList.remove('fog');
    UI.canvas.classList.remove('normal');
    UI.canvas.classList.add(mode);
});

Events.register('world-changed', draw);
Events.register('viewport-changed', draw);
Events.register('object-selected', async (ob: MapObject) => {

    enum Position { BEFORE, IN, AFTER };

    const viewPos = (pos: number, min: number, max: number): Position => {
        if (pos < min) {
            return Position.BEFORE;
        }
        if (pos >= max) {
            return Position.AFTER;
        }
        return Position.IN;
    }

    const screenScale = Viewport.zoom() * ob.zoom / 2000;
    const imageMiddle = Viewport.world2Screen(ob);

    const image = await ensureImage(ob);
    const halfImageSize = Point.fromCoords(image.width * screenScale, image.height * screenScale);
    const topLeft = Point.add(imageMiddle, Point.scale(halfImageSize, -1));
    const bottomRight = Point.add(imageMiddle, Point.scale(halfImageSize, 1));

    // TODO: check if a point of one rectangle is in the other, or vice versa

    const leftEdge = viewPos(topLeft.x, 0, UI.canvas.width);
    const rightEdge = viewPos(bottomRight.x, 0, UI.canvas.width);
    const topEdge = viewPos(topLeft.y, 0, UI.canvas.height);
    const bottomEdge = viewPos(bottomRight.y, 0, UI.canvas.height);

    const xIn = leftEdge === Position.IN || rightEdge === Position.IN || leftEdge !== rightEdge;
    const yIn = topEdge === Position.IN || bottomEdge === Position.IN || topEdge !== bottomEdge;

    if (!xIn || !yIn) {
        await Viewport.moveOrigin(Point.scale(topLeft, -1));
    }
});



