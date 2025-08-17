
const HOST_PORT = new URL(window.location.href);

let messageListener: ((message: Blob) => void) | undefined = undefined;
let statusListener: ((open: SocketStatus) => void) | undefined = undefined;

let socket: WebSocket | undefined;
let init = 0;
export type SocketStatus = 'disconnected' | 'connecting...' | 'waiting...' | 'connected';

const connect = () => {
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
        setTimeout(connect, 10000);
    });

    socket.addEventListener('message', event => {
        messageListener?.(event.data);
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
        socket?.send(blob);
    }
}