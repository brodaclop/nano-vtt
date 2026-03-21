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
import { Operations } from "./operations";

console.log('App loaded');

export const appInit = async () => {

    initLobby();

    // add dummy objects
    const map = await (await fetch('/assets/alunselkirk.jpg')).blob();
    const goblin = await (await fetch('/assets/goblin.png')).blob();
    const ballista = await (await fetch('/assets/ballista.png')).blob();

    await Operations.add(map, 0, 0);
    await Operations.add(goblin, 200, 200);
    await Operations.add(goblin, 600, 200);
    await Operations.add(ballista, 420, 300);
    await Operations.rotate(180);
}






