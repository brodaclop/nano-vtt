import { drawChat } from "./chat";
import { random } from "./random";
import { sendHelloMessage, sendJoinMessage } from "./websocket";

export interface JoinMessage {
    sender: number;
    room: string;
}

export interface HelloMessage {
    sender: number;
    name: string;
}

export const CHAT_USER_ID = random();
const myName = `user${CHAT_USER_ID}`;

export const USERS: Record<number, string> = {
    [CHAT_USER_ID]: myName
};

export const receiveJoinMessage = (message: JoinMessage) => {
    USERS[message.sender] = `user${message.sender}`
}

export const receiveHelloMessage = (message: HelloMessage) => {
    USERS[message.sender] = message.name;
    drawChat();
}

export const joinRoom = (room: string) => {
    sendJoinMessage({ sender: CHAT_USER_ID, room });
}

export const hello = () => {
    sendHelloMessage({ sender: CHAT_USER_ID, name: myName });
}