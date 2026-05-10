import { initLobby } from "./lobby";
import "./controls/keys";
import "./controls/mouse";
import "./controls/menu";
import "./dom";
import "./room";
import "./chat";
import "./messages";
import "./canvas";
import "./world";
import "./editor";
import "./mapgen/mapgen";
import { World } from "./world";
import { UI } from "./dom";

console.log('App loaded');

const observer = new ResizeObserver(() => {
    console.log('size changed');
    const iframe = UI.plugin.main.querySelector('iframe') as HTMLIFrameElement;
    iframe.contentWindow?.postMessage({
        type: 'resize',
        width: iframe.clientWidth,
        height: iframe.clientHeight
    })
});

observer.observe(UI.plugin.main)


export const appInit = async () => {

    initLobby();

    // add dummy objects
    const map = await (await fetch('/assets/alunselkirk.jpg')).blob();
    const goblin = await (await fetch('/assets/goblin.png')).blob();
    const ballista = await (await fetch('/assets/ballista.png')).blob();

    const localAdd = async (data: Blob, x: number, y: number, id: number, angle: number) => {
        await World.change.update({
            id,
            angle,
            x,
            y,
            layer: World.layers.max + 1,
            locked: 0,
            zoom: 1000,
            data
        })
    }

    await localAdd(map, 0, 0, 1, 0);
    await localAdd(goblin, 200, 200, 2, 0);
    await localAdd(goblin, 600, 200, 3, 0);
    await localAdd(ballista, 420, 300, 4, 180);
}






