import { Events } from "./events";
import { fromBinary, Header, toBinary } from "./utils/headers";
import { random } from "./utils/random";

export type SocketStatus = 'disconnected' | 'connecting...' | 'waiting...' | 'connected';

interface MessageBuffer {
    fragments: Array<Blob>;
    startTime: number;
}

interface FragmentHeader {
    messageId: number;
    count: number;
    total: number;
}

const MAX_FRAGMENT_SIZE = 1_000_000;

let socket: WebSocket | undefined;
let reconnect: number | undefined = undefined;

const messageBuffer: Record<number, MessageBuffer> = {};

const FORMAT: Header<FragmentHeader> = [
    {
        key: 'messageId',
        length: 4,
        signed: false
    },
    {
        key: 'count',
        length: 1,
        signed: false
    },
    {
        key: 'total',
        length: 1,
        signed: false
    }
]

const receiveFragment = async (blob: Blob) => {
    const [header, payload] = await fromBinary(blob, FORMAT);
    if (!messageBuffer[header.messageId]) {
        messageBuffer[header.messageId] = {
            fragments: Array(header.total).fill(undefined),
            startTime: Date.now()
        }
    }
    messageBuffer[header.messageId].fragments[header.count] = payload;
    if (messageBuffer[header.messageId].fragments.every(frag => !!frag)) {
        Events.emit({ type: 'incoming-message', payload: new Blob(messageBuffer[header.messageId].fragments) })
        delete messageBuffer[header.messageId];
    }
};


const splitToFragments = (blob: Blob): Array<Blob> => {
    const id = random();
    const fragmentCount = Math.ceil(blob.size / MAX_FRAGMENT_SIZE);
    const ret: Array<Blob> = [];
    if (fragmentCount > 255) {
        throw new Error('too many fragments');
    }
    for (let i = 0; i < fragmentCount; i++) {
        const data = blob.slice(i * MAX_FRAGMENT_SIZE, (i + 1) * MAX_FRAGMENT_SIZE);
        const header = toBinary({
            messageId: id,
            count: i,
            total: fragmentCount
        }, FORMAT);

        ret.push(new Blob([header, data]));
    }
    return ret;
}


await Events.emit({ type: 'socket-status-changed', payload: 'disconnected' });

const connect = () => {
    if (socket !== undefined) {
        console.trace('Socket already initialised');
        return;
    }
    reconnect = undefined;
    Events.emit({ type: 'socket-status-changed', payload: 'connecting...' });
    console.trace('Connecting...');
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    socket = new WebSocket(`${protocol}://${host}/ws`);
    socket.addEventListener("open", (event) => {
        Events.emit({ type: 'socket-status-changed', payload: 'connected' });
    });

    socket.addEventListener('close', () => {
        console.trace('Disconnected, reconnecting in 30 seconds.');
        socket = undefined;
        Events.emit({ type: 'socket-status-changed', payload: 'waiting...' });
        if (!reconnect) {
            reconnect = setTimeout(connect, 10000) as any;
        }
    });

    socket.addEventListener('message', event => {
        receiveFragment(event.data);
    });

    socket.addEventListener('error', error => {
        console.warn('Socket error', error);
        socket?.close();
    });
}

connect();

export const Socket = {
    send: (blob: Blob) => {
        const fragments = splitToFragments(blob);
        fragments.forEach((frag, idx) => {
            socket?.send(frag);
        })
    }
}