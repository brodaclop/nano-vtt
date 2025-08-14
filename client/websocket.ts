
const HOST_PORT = new URL(window.location.href);

let messageListener: ((message: Blob) => void) | undefined = undefined;
let statusListener: ((open: SocketStatus) => void) | undefined = undefined;

let socket: WebSocket | undefined;
export type SocketStatus = 'closed' | 'connecting' | 'waiting' | 'open';

const connect = () => {
    statusListener?.('connecting');
    console.log('Connecting...');
    socket = new WebSocket(`ws://${HOST_PORT.host}/api`);
    socket.addEventListener("open", (event) => {
        console.log('Connected');
        statusListener?.('open');
    });

    socket.addEventListener('close', () => {
        console.log('Disconnected, reconnecting in 30 seconds.');
        socket = undefined;
        statusListener?.('waiting');
        setTimeout(connect, 30000);
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
    },
    registerSocketStatusListener: (listener: (socketOpen: SocketStatus) => void): void => {
        statusListener = listener;
    },
    send: (blob: Blob) => {
        socket?.send(blob);
    }
}