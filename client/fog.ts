import { Point } from "./utils/point";
import { FogCircle } from "./types/map-objects";
import { Viewport } from "./viewport";
import { Room } from "./room";

let ownFogCanvas: OffscreenCanvas = new OffscreenCanvas(0, 0);
let othersFogCanvas: OffscreenCanvas = new OffscreenCanvas(0, 0);
let ownCtx: OffscreenCanvasRenderingContext2D = ownFogCanvas.getContext('2d')!;
let othersCtx: OffscreenCanvasRenderingContext2D = othersFogCanvas.getContext('2d')!;

export const Fog = {
    draw: (fog: Array<FogCircle>, size: Point) => {
        ownCtx.canvas.width = size.x;
        ownCtx.canvas.height = size.y;
        othersCtx.canvas.width = size.x;
        othersCtx.canvas.height = size.y;
        ownCtx.globalAlpha = 1;
        othersCtx.globalAlpha = 1;
        fog.forEach(f => {
            drawFogCircle(f, f.owner === Room.me ? ownCtx : othersCtx);
        });
        return { own: ownCtx.canvas, other: othersCtx.canvas };
    },
    isScreenPointInFog: (p: Point): boolean => {
        const imageData = othersCtx.getImageData(p.x, p.y, 1, 1);
        return imageData.data[3] > 0;
    }
};

const drawFogCircle = (f: FogCircle, ctx: OffscreenCanvasRenderingContext2D) => {
    const origin = Viewport.world2Screen(Point.fromCoords(f.originX, f.originY));
    const radius = Viewport.zoom() * f.radius;
    ctx.beginPath();
    ctx.ellipse(origin.x, origin.y, radius, radius, 0, 0, 2 * Math.PI);
    if (f.reverted) {
        ctx.save();
        ctx.clip();
        ctx.clearRect(origin.x - radius, origin.y - radius, 2 * radius, 2 * radius);
        ctx.restore();
    } else {
        ctx.fillStyle = 'black';
        ctx.fill();
    }
}

