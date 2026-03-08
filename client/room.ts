import { random } from "./random";
import { sendHelloMessage, sendJoinMessage } from "./messages";
import { Socket } from "./websocket";
import { UI } from "./dom";
import { Events } from "./events";
import { HelloMessage, JoinMessage } from "./types/map-objects";



let MY_USER_ID = random();

const storedId = sessionStorage.getItem('user_id');
if (storedId) {
    MY_USER_ID = Number(storedId);
} else {
    sessionStorage.setItem('user_id', String(MY_USER_ID));
}

const USERS: Record<number, string> = {};


const receiveJoinMessage = (message: JoinMessage) => {
    USERS[message.sender] = message.name;
    updateRoomDisplay();
    hello();
    Events.emit({ type: 'chat-received', payload: { id: random(), sender: message.sender, text: '<joined>' } })
}

const receiveHelloMessage = (message: HelloMessage) => {
    if (USERS[message.sender] !== message.name) {
        if (USERS[message.sender]) {
            Events.emit({ type: 'chat-received', payload: { id: random(), sender: message.sender, text: `${USERS[message.sender]} --> ${message.name} ` } });
        }
        USERS[message.sender] = message.name;
        updateRoomDisplay();
    }
}



let currentRoom: string | undefined = undefined;

Socket.registerSocketStatusListener(status => {
    UI.menu.connection.innerText = status === 'connected' ? '' : status;
    UI.menu.connection.style.display = (status === 'connected') ? 'none' : 'inline';
    UI.menu.connected.style.display = (status !== 'connected') ? 'none' : 'inline';
    if (status === 'connected' && currentRoom) {
        joinRoom(currentRoom, USERS[MY_USER_ID]);
    }
});

const updateRoomDisplay = () => {
    UI.menu.room.innerText = `${currentRoom} (${Object.keys(USERS).length} users)`;
    UI.menu.room.title = `Users:\n\n${Object.values(USERS).join('\n')}`;
    UI.menu.name.innerText = USERS[MY_USER_ID];
    UI.chat.userList.innerText = Object.entries(USERS).map(u => `${u[1]}${u[0] === String(MY_USER_ID) ? ' (you)' : ''}`).join(', ')
}

const joinRoom = (room: string, name: string,) => {
    currentRoom = room;
    USERS[MY_USER_ID] = name;
    updateRoomDisplay();
    sendJoinMessage({ sender: MY_USER_ID, room, name: USERS[MY_USER_ID] });
}

const hello = (newName?: string) => {
    const name = newName ?? USERS[MY_USER_ID];
    USERS[MY_USER_ID] = name;
    sendHelloMessage({ sender: MY_USER_ID, name });
}

export const Room = {
    joined: receiveJoinMessage,
    helloed: receiveHelloMessage,
    join: joinRoom,
    me: MY_USER_ID,
    userName: (userId: number) => USERS[userId]
};
