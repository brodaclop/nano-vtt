import { random } from "./utils/random";
import { Events } from "./events";
import { HelloMessage, JoinMessage } from "./types/map-objects";
import { Send } from "./messages";

let MY_USER_ID = random();
const users: Map<number, string> = new Map();
const storedId = sessionStorage.getItem('user_id');
let currentRoom: string | undefined = undefined;


if (storedId) {
    MY_USER_ID = Number(storedId);
} else {
    sessionStorage.setItem('user_id', String(MY_USER_ID));
}

Events.register('socket-status-changed', status => {
    if (status === 'connected' && currentRoom) {
        joinRoom(currentRoom, users.get(MY_USER_ID)!);
    }
});

Events.register('join-received', (message: JoinMessage) => {
    users.set(message.sender, message.name);
    hello();
    Events.emit({ type: 'room-changed', payload: [...users.keys()] })
    Events.emit({ type: 'chat-received', payload: { id: random(), sender: message.sender, text: '<joined>' } })
});

Events.register('hello-received', ({ sender, name }: HelloMessage) => {
    if (users.get(sender) !== name) {
        if (users.has(sender)) {
            Events.emit({ type: 'chat-received', payload: { id: random(), sender, text: `${users.get(sender)} --> ${name} ` } });
        }
        users.set(sender, name);
        Events.emit({ type: 'room-changed', payload: [...users.keys()] })
    }
});

const joinRoom = (room: string, name: string,) => {
    currentRoom = room;
    users.set(MY_USER_ID, name);
    Events.emit({ type: 'room-changed', payload: [...users.keys()] })
    Send.join({ sender: MY_USER_ID, room, name });
}

const hello = (newName?: string) => {
    const name = newName ?? users.get(MY_USER_ID)!;
    users.set(MY_USER_ID, name);
    Send.hello({ sender: MY_USER_ID, name });
}

export const Room = {
    join: joinRoom,
    me: MY_USER_ID,
    get roomName() {
        return currentRoom;
    },
    userName: (userId: number) => users.get(userId)!
};
