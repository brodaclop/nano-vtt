import { UI } from "./dom";
import { Events } from "./events";
import { Fog } from "./fog";
import { Point } from "./utils/point";
import { Grid, MapObject } from "./types/map-objects";
import { Viewport } from "./viewport";
import { World } from "./world";
import { Editor } from "./editor";

let ctx: CanvasRenderingContext2D;


const setCanvasSize = () => {
    const menu = UI.menu.container.getBoundingClientRect();
    UI.canvas.width = window.visualViewport?.width!;
    UI.canvas.height = window.visualViewport?.height! - menu.height;
}

(() => {
    setCanvasSize();
    ctx = UI.canvas.getContext('2d')!;
    window.onresize = () => {
        setCanvasSize();
        Events.emit({ type: 'viewport-changed' });
    };
})();



const draw = async () => {
    clearCanvas();
    ctx.resetTransform();
    const { objects, grid, fog } = World;
    drawGrid(grid);
    for (const ob of sortObjects(objects)) {
        const { width, height } = ob.image;
        ctx.setTransform(createObjectTransform(ob));
        ctx.globalAlpha = (!Editor.isSelected() && !Editor.isSelected(ob)) ? 0.7 : 0.8;
        ctx.drawImage(ob.image, - width / 2, - height / 2);
        if (Editor.isSelected(ob)) {
            drawHighlight(ob, width, height);
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

export const sortObjects = (objects: MapObject[]): typeof objects => objects.toSorted((a, z) => {
    return z.layer - a.layer;
}).toReversed();

export const createObjectTransform = (ob: MapObject) => {
    const ret: DOMMatrix = new DOMMatrix();
    const origin = Viewport.world2Screen(ob);
    return ret
        .translate(origin.x, origin.y)
        .scale(ob.zoom * Viewport.zoom() / 1000)
        .rotate(ob.angle);
}

const clearCanvas = () => {
    ctx.reset();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
}

const drawGrid = (grid: Grid) => {
    ctx.beginPath();
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



Events.register('object-selected', draw);

Events.register('edit-mode-changed', mode => {
    UI.canvas.classList.remove('fog');
    UI.canvas.classList.remove('normal');
    UI.canvas.classList.add(mode);
});

Events.register('world-changed', draw);
Events.register('viewport-changed', draw);
Events.register('object-selected', async (ob?: MapObject) => {
    if (!ob) {
        return;
    }

    const image = ob.image;
    const halfDiagonal = Point.rotate(Point.scale(Point.fromCoords(image.width, image.height), Viewport.zoom() * ob.zoom / 2000), ob.angle);
    const screenMiddle = Viewport.world2Screen(ob);

    const topLeft = Point.fromCoords(screenMiddle.x - halfDiagonal.x, screenMiddle.y - halfDiagonal.y);
    const bottomLeft = Point.fromCoords(screenMiddle.x - halfDiagonal.y, screenMiddle.y + halfDiagonal.x);
    const bottomRight = Point.fromCoords(screenMiddle.x + halfDiagonal.x, screenMiddle.y + halfDiagonal.y);
    const topRight = Point.fromCoords(screenMiddle.x + halfDiagonal.y, screenMiddle.y - halfDiagonal.x);

    const objectRectangle = [topLeft, bottomLeft, bottomRight, topRight];
    const screenRectangle = [Point.fromCoords(0, 0), Point.fromCoords(0, ctx.canvas.height), Point.fromCoords(ctx.canvas.width, ctx.canvas.height), Point.fromCoords(ctx.canvas.width, 0)];

    const obOnScreen = objectRectangle.some(p => Point.isInside(p, screenRectangle));
    const screenOnOb = screenRectangle.some(p => Point.isInside(p, objectRectangle));


    if (!obOnScreen && !screenOnOb) {
        await Viewport.setOrigin(Point.scale(Point.add(ob, Point.scale(Point.fromCoords(image.width, image.height), -ob.zoom / 2000)), -1));
    }
});

const debugCircle = (p: Point, style: typeof CanvasRenderingContext2D['prototype']['fillStyle']) => {
    ctx.resetTransform();
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.ellipse(p.x, p.y, 10, 10, 0, 0, 2 * Math.PI);
    ctx.fillStyle = style;
    ctx.fill();
    ctx.beginPath();
}


export function drawHighlight(ob: MapObject, width: number, height: number) {
    ctx.lineWidth = 3000 / ob.zoom;
    ctx.strokeStyle = ob.locked ? 'red' : '#E6F41D';
    ctx.globalAlpha = 1;
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = 'lightgreen';
    ctx.fillRect(-width / 2, -height / 2, width, height);
}

