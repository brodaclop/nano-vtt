import { addChatMessage, drawChat } from "./chat";
import { random } from "./random";
import { sendHelloMessage, sendJoinMessage } from "./messages";
import { Socket } from "./websocket";
import { UI } from "./dom";

export interface JoinMessage {
    sender: number;
    room: string;
    name: string;
}

export interface HelloMessage {
    sender: number;
    name: string;
}

export const MY_USER_ID = random();

export const USERS: Record<number, string> = {};

export const receiveJoinMessage = (message: JoinMessage) => {
    console.log('Receiving join message', message);
    USERS[message.sender] = message.name;
    addChatMessage({ id: random(), sender: message.sender, text: '<joined>' });
}

export const receiveHelloMessage = (message: HelloMessage) => {
    if (USERS[message.sender] !== message.name) {
        if (USERS[message.sender]) {
            addChatMessage({ id: random(), sender: message.sender, text: `${USERS[message.sender]} --> ${message.name} ` });
        }
        USERS[message.sender] = message.name;
        drawChat();
    }
}

let currentRoom: string | undefined = undefined;

Socket.registerSocketStatusListener(open => {
    UI.connection.innerText = open === 'open' ? '' : open;
    if (open === 'open' && currentRoom) {
        joinRoom(currentRoom, USERS[MY_USER_ID]);
    }
})

export const joinRoom = (room: string, name: string) => {
    currentRoom = room;
    USERS[MY_USER_ID] = name;
    sendJoinMessage({ sender: MY_USER_ID, room, name: USERS[MY_USER_ID] });
}

export const hello = (newName?: string) => {
    const name = newName ?? USERS[MY_USER_ID];
    USERS[MY_USER_ID] = name;
    sendHelloMessage({ sender: MY_USER_ID, name });
}