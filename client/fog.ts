import { Point } from "./utils/point";
import { FogCircle } from "./types/map-objects";
import { Viewport } from "./viewport";

let fogCanvas: OffscreenCanvas = new OffscreenCanvas(0, 0);
let ctx: OffscreenCanvasRenderingContext2D = fogCanvas.getContext('2d')!;

export const Fog = {
    draw: (fog: Array<FogCircle>, size: Point) => {
        ctx.canvas.width = size.x;
        ctx.canvas.height = size.y;
        fog.forEach(f => {
            const origin = Viewport.world2Screen(f.origin);
            const radius = Viewport.zoom() * f.radius;
            ctx.beginPath();
            ctx.ellipse(origin.x, origin.y, radius, radius, 0, 0, 2 * Math.PI);
            if (f.reverted) {

                ctx.save();
                ctx.clip();
                ctx.clearRect(origin.x - radius, origin.y - radius, 2 * radius, 2 * radius);
                ctx.restore();
            } else {
                ctx.globalAlpha = 1;
                // const gradient = ctx.createRadialGradient(origin.x, origin.y, radius * 0.9, origin.x, origin.y, radius);
                // gradient.addColorStop(0, 'black');
                // gradient.addColorStop(0.5, 'black');
                // gradient.addColorStop(1, '#00000000');
                ctx.fillStyle = 'red';
                ctx.fill();
            }
        });
        return ctx.canvas;
    },
    isScreenPointInFog: (p: Point): boolean => {
        const imageData = ctx.getImageData(p.x, p.y, 1, 1);
        return imageData.data[3] > 0;
    }
};
