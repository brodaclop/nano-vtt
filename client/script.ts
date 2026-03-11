import { Canvas } from "./canvas";
import { Chat } from "./chat";
import { Events } from "./events";
import { initLobby } from "./lobby";
import { Room } from "./room";
import { World } from "./world";
import "./controls/keys";
import "./controls/drag";
import "./controls/menu";
import { Operations } from "./operations";

console.log('App loaded');


Events.register('world-changed', Canvas.draw);
Events.register('viewport-changed', Canvas.draw);
Events.register('object-selected', Canvas.scrollIntoView);
Events.register('chat-received', Chat.incomingChatMessage);
Events.register('typing-received', Chat.incomingTyping);
Events.register('grid-received', World.change.setGrid);
Events.register('object-delete-received', World.change.remove);
Events.register('object-received', World.change.update);
Events.register('sync-received', World.change.replace);
Events.register('join-received', Room.joined);
Events.register('hello-received', Room.helloed);


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





