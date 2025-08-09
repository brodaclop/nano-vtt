import { ChatMessage, addChatMessage } from "./chat";
import { hello, HelloMessage, JoinMessage, joinRoom, receiveHelloMessage, receiveJoinMessage } from "./room";
import { MapObjects } from "./screen";
import { MapObject } from "./types/map-objects";

const HOST_PORT = new URL(window.location.href);

enum MessageType {
    PING = 0,
    OBJECT = 1,
    CHAT = 2,
    JOIN_ROOM = 3,
    HELLO = 4
}

const socket = new WebSocket(`ws://${HOST_PORT.host}/api`);
let socketOpen = false;

socket.addEventListener("open", (event) => {
    console.log('socket opened');
    socketOpen = true;
    joinRoom('teszt');
});

socket.addEventListener('close', () => {
    console.log('socket closed');
    socketOpen = false;
});

// Listen for messages
socket.addEventListener("message", async (event) => {
    console.log("Message from server ", event.data);
    const [type, payload] = await fromMessage(event.data);
    switch (type) {
        case MessageType.OBJECT: {
            const decoded = await fromObjectMessage(payload);
            if ('deletedId' in decoded) {
                MapObjects.remove(decoded.deletedId);
            } else {
                MapObjects.update(decoded);
            }
            return;
        }
        case MessageType.CHAT: {
            addChatMessage(await fromChatMessage(payload));
            return;
        }
        case MessageType.JOIN_ROOM: {
            receiveJoinMessage(await fromJoinMessage(payload));
            hello();
            return;
        }
        case MessageType.HELLO: {
            receiveHelloMessage(await fromHelloMessage(payload));
            return;
        }
        default: throw new Error(`Unknown message type: ${type}`)
    }
});

const send = (messageType: MessageType, blob: Blob) => {
    if (!socketOpen) {
        console.warn('Failed to send message, socket is closed');
        return;
    }
    const payload = toMessage(messageType, blob);
    socket.send(payload);
}

export const sendJoinMessage = (message: JoinMessage) => {
    const buffer = new ArrayBuffer(4);
    const header = new DataView(buffer);
    header.setUint32(0, message.sender);
    send(MessageType.JOIN_ROOM, new Blob([buffer, message.room]));
}

export const sendHelloMessage = (message: HelloMessage) => {
    const buffer = new ArrayBuffer(4);
    const header = new DataView(buffer);
    header.setUint32(0, message.sender);
    send(MessageType.HELLO, new Blob([buffer, message.name]));
}


const CHAT_HEADER_LENGTH = 2 * 4;

export const sendChatMessage = (message: ChatMessage) => {
    const buffer = new ArrayBuffer(CHAT_HEADER_LENGTH);
    const header = new DataView(buffer);
    header.setUint32(0, message.id);
    header.setUint32(4, message.sender);
    send(MessageType.CHAT, new Blob([buffer, message.text]))
}

const fromChatMessage = async (blob: Blob): Promise<ChatMessage> => {
    const buffer = await blob.slice(0, CHAT_HEADER_LENGTH).arrayBuffer();
    const header = new DataView(buffer);
    const id = header.getUint32(0);
    const sender = header.getUint32(4);
    const text = await blob.slice(CHAT_HEADER_LENGTH).text();
    return { id, sender, text };
}

const fromHelloMessage = async (blob: Blob): Promise<HelloMessage> => {
    const buffer = await blob.slice(0, 4).arrayBuffer();
    const header = new DataView(buffer);
    const sender = header.getUint32(0);
    const name = await blob.slice(4).text();
    return { sender, name };
}

const fromJoinMessage = async (blob: Blob): Promise<JoinMessage> => {
    const buffer = await blob.slice(0, 4).arrayBuffer();
    const header = new DataView(buffer);
    const sender = header.getUint32(0);
    const room = await blob.slice(4).text();
    return { sender, room };
}


export const sendObject = (ob: MapObject, fields: Array<keyof MapObject> = ALL_FIELDS) => {
    send(MessageType.OBJECT, toObjectMessage(ob, fields));
}

export const sendDelete = (id: number) => {
    send(MessageType.OBJECT, toObjectMessage({ id } as MapObject, ['id'], true));
}

const NUMBER_FIELDS: Array<keyof MapObject> = ['id', 'x', 'y', 'zoom', 'layer', 'angle'];

const ALL_FIELDS: Array<keyof MapObject> = [...NUMBER_FIELDS, 'data'];

const DATA_IDX = NUMBER_FIELDS.length;
const OBJECT_HEADER_LENGTH = NUMBER_FIELDS.length * 4 + 8;

const toMessage = (type: MessageType, contents: Blob): Blob => {
    const typeHeader = new Uint8Array(1);
    typeHeader[0] = type;
    return new Blob([typeHeader, contents]);
}

const fromMessage = async (blob: Blob): Promise<[MessageType, Blob]> => {
    const typeBuffer = await blob.slice(0, 1).arrayBuffer();
    const header = new DataView(typeBuffer);
    const messageType = header.getUint8(0) as MessageType;
    return [messageType, await blob.slice(1)];
}

const toObjectMessage = (ob: MapObject, fields: Array<keyof MapObject>, deleteFlag = false): Blob => {
    // ID must be present in every message
    if (!fields.includes('id')) {
        fields.push('id')
    }
    const buffer = new ArrayBuffer(OBJECT_HEADER_LENGTH);
    const header = new DataView(buffer);
    let mask = deleteFlag ? 1 << 31 : 0;
    NUMBER_FIELDS.forEach((field, idx) => {
        if (fields.includes(field)) {
            header.setInt32(4 + idx * 4, ob[field] as number);
            mask |= (1 << idx);
        }
    });
    const parts: Array<BlobPart> = [header];
    if (fields.includes('data')) {
        header.setInt32(4 + DATA_IDX * 4, ob.data.size);
        mask |= (1 << DATA_IDX);
        parts.push(ob.data);
    }
    header.setInt32(0, mask);
    return new Blob(parts);
}

const fromObjectMessage = async (blob: Blob): Promise<Partial<MapObject> | { deletedId: number }> => {
    const ob: Partial<MapObject> = {};
    const buffer = await blob.slice(0, OBJECT_HEADER_LENGTH).arrayBuffer();
    const header = new DataView(buffer);
    const data = await blob.slice(OBJECT_HEADER_LENGTH);
    const mask = header.getUint32(0);
    NUMBER_FIELDS.forEach((field, idx) => {
        if (mask & (1 << idx)) {
            ob[field] = header.getInt32(4 + idx * 4) as (number & Blob);
        }
    });
    if (mask & (1 << DATA_IDX)) {
        ob.data = data;
    }

    const deleteFlag = mask & (1 << 31);
    if (deleteFlag) {
        return { deletedId: ob.id! };
    }

    return ob;
}

