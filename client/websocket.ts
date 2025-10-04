import { fromBinary, Header, toBinary } from "./headers";
import { random } from "./random";

const HOST_PORT = new URL(window.location.href);

let messageListener: ((message: Blob) => void) | undefined = undefined;
let statusListener: ((open: SocketStatus) => void) | undefined = undefined;

let socket: WebSocket | undefined;
let init = 0;
export type SocketStatus = 'disconnected' | 'connecting...' | 'waiting...' | 'connected';

interface MessageBuffer {
    fragments: Array<Blob>;
    startTime: number;
}

const messageBuffer: Record<number, MessageBuffer> = {};

interface FragmentHeader {
    messageId: number;
    count: number;
    total: number;
}

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
        messageListener?.(new Blob(messageBuffer[header.messageId].fragments));
        delete messageBuffer[header.messageId];
    }
};

const MAX_FRAGMENT_SIZE = 1_000_000;

const splitToFragments = (blob: Blob): Array<Blob> => {
    const id = random();
    const fragmentCount = Math.ceil(blob.size / MAX_FRAGMENT_SIZE);
    const ret: Array<Blob> = [];
    if (fragmentCount > 255) {
        throw new Error('too many fragments');
    }
    for (let i = 0; i < fragmentCount; i++) {
        const data = blob.slice(i * MAX_FRAGMENT_SIZE, (i+1)*MAX_FRAGMENT_SIZE);
        const header = toBinary({
            messageId: id,
            count: i,
            total: fragmentCount
        }, FORMAT);

        ret.push(new Blob([header, data]));
    }
    return ret;
}

let reconnect: number | undefined = undefined;


const connect = () => {
    if (socket !== undefined) {
        console.trace('Socket already initialised');
        return;
    }
    reconnect = undefined;
    statusListener?.('connecting...');
    console.log('Connecting...');
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    socket = new WebSocket(`${protocol}://${HOST_PORT.host}/ws`);
    socket.addEventListener("open", (event) => {
        console.log('Connected');
        statusListener?.('connected');
    });

    socket.addEventListener('close', () => {
        console.log('Disconnected, reconnecting in 30 seconds.');
        socket = undefined;
        statusListener?.('waiting...');
        if (!reconnect) {
            reconnect = setTimeout(connect, 10000) as any;
        }
    });

    socket.addEventListener('message', event => {
        receiveFragment(event.data);
    });

    socket.addEventListener('error', error => {
        console.log('Socket error', error);
        socket?.close();
    });
}

connect();

export const Socket = {
    registerMessageListener: (listener: (message: Blob) => void): void => {
        messageListener = listener;
        init++;
        if (init >= 2) {
            connect();
        }
    },
    registerSocketStatusListener: (listener: (socketOpen: SocketStatus) => void): void => {
        statusListener = listener;
        init++;
        if (init >= 2) {
            connect();
        }
    },
    send: (blob: Blob) => {
        const fragments = splitToFragments(blob);
        fragments.forEach((frag, idx) => {
            socket?.send(frag);
        })
    }
}