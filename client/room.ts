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


export let MY_USER_ID = random();

const storedId = sessionStorage.getItem('user_id');
if (storedId) {
    MY_USER_ID = Number(storedId);
} else {
    sessionStorage.setItem('user_id', String(MY_USER_ID));
}


export const USERS: Record<number, string> = {};

export const receiveJoinMessage = (message: JoinMessage) => {
    USERS[message.sender] = message.name;
    updateRoomDisplay();
    addChatMessage({ id: random(), sender: message.sender, text: '<joined>' });
}

export const receiveHelloMessage = (message: HelloMessage) => {
    if (USERS[message.sender] !== message.name) {
        if (USERS[message.sender]) {
            addChatMessage({ id: random(), sender: message.sender, text: `${USERS[message.sender]} --> ${message.name} ` });
        }
        USERS[message.sender] = message.name;
        updateRoomDisplay();
        drawChat();
    }
}

let currentRoom: string | undefined = undefined;

Socket.registerSocketStatusListener(status => {
    UI.menu.connection.innerText = status === 'connected' ? '' : status;
    if (status === 'connected' && currentRoom) {
        joinRoom(currentRoom, USERS[MY_USER_ID]);
    }
});

const updateRoomDisplay = () => {
    UI.menu.room.innerText = `${currentRoom} (${Object.keys(USERS).length} users)`;
    UI.menu.name.innerText = USERS[MY_USER_ID];

}

export const joinRoom = (room: string, name: string) => {
    currentRoom = room;
    USERS[MY_USER_ID] = name;
    updateRoomDisplay();
    sendJoinMessage({ sender: MY_USER_ID, room, name: USERS[MY_USER_ID] });
}

export const hello = (newName?: string) => {
    const name = newName ?? USERS[MY_USER_ID];
    USERS[MY_USER_ID] = name;
    sendHelloMessage({ sender: MY_USER_ID, name });
}