import { ChatMessage, addChatMessage } from "./chat";
import { hello, HelloMessage, JoinMessage, joinRoom, receiveHelloMessage, receiveJoinMessage } from "./room";
import { World } from "./world";
import { Grid, MapObject } from "./types/map-objects";
import { Socket } from "./websocket";

const HOST_PORT = new URL(window.location.href);

enum MessageType {
    PING = 0,
    OBJECT = 1,
    CHAT = 2,
    JOIN_ROOM = 3,
    HELLO = 4,
    SYNC = 5,
    GRID = 6,
}

// Listen for messages
Socket.registerMessageListener(async data => {
    const [type, payload] = await fromMessage(data);
    switch (type) {
        case MessageType.OBJECT: {
            const decoded = await fromObjectMessage(payload);
            if ('deletedId' in decoded) {
                World.remove(decoded.deletedId);
            } else {
                World.update(decoded);
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
        case MessageType.SYNC: {
            const { obs, grid } = await fromSyncMessage(payload);
            await World.replace(obs);
            await World.setGrid(grid);
            return;
        }
        case MessageType.GRID: {
            const grid = await fromGridMessage(payload);
            World.setGrid(grid);
            return;
        }
        default: throw new Error(`Unknown message type: ${type}`)
    }
});

const send = (messageType: MessageType, blob: Blob) => {
    const payload = toMessage(messageType, blob);
    Socket.send(payload);
}

export const sendSyncMessage = (obs: Array<MapObject>, grid: Grid) => {
    send(MessageType.SYNC, toSyncMessage(obs, grid));
}

export const sendJoinMessage = (message: JoinMessage) => {
    const buffer = new ArrayBuffer(4);
    const header = new DataView(buffer);
    header.setUint32(0, message.sender);
    send(MessageType.JOIN_ROOM, new Blob([buffer, `${message.room.replaceAll(' | ', '')} | ${message.name.replaceAll(' | ', '')}`]));
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

export const sendGridMessage = (grid: Grid) => {
    send(MessageType.GRID, toGridMessage(grid));
}

const toGridMessage = (grid: Grid): Blob => {
    const buffer = new ArrayBuffer(8);
    const header = new DataView(buffer);
    header.setUint32(0, grid.size);
    header.setFloat32(4, grid.strength);
    return new Blob([buffer]);
}

const fromGridMessage = async (blob: Blob): Promise<Grid> => {
    const buffer = await blob.slice(0, 8).arrayBuffer();
    const header = new DataView(buffer);
    const size = header.getUint32(0);
    const strength = header.getFloat32(4);
    return { size, strength };
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
    const roomAndName = await blob.slice(4).text();
    const [room, name] = roomAndName.split(' | ');
    return { sender, room, name };
}


export const sendObject = (ob: MapObject, fields: Array<keyof MapObject> = ALL_FIELDS) => {
    send(MessageType.OBJECT, toObjectMessage(ob, fields));
}

export const sendDelete = (id: number) => {
    send(MessageType.OBJECT, toObjectMessage({ id } as MapObject, ['id'], true));
}

const NUMBER_FIELDS: Array<keyof MapObject> = ['id', 'x', 'y', 'zoom', 'layer', 'locked', 'angle'];

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
    const dataLength = header.getInt32(4 + DATA_IDX * 4);
    const data = await blob.slice(OBJECT_HEADER_LENGTH, OBJECT_HEADER_LENGTH + dataLength);
    const mask = header.getUint32(0);
    NUMBER_FIELDS.forEach((field, idx) => {
        if (mask & (1 << idx)) {
            ob[field] = header.getInt32(4 + idx * 4) as (number & Blob);
        }
    });
    if (mask & (1 << DATA_IDX)) {
        ob.data = data;
    }



    return ob;
}

const toSyncMessage = (obs: Array<MapObject>, grid: Grid): Blob => {
    const blobs = obs.map(ob => toObjectMessage(ob, ALL_FIELDS));
    return new Blob([toGridMessage(grid), ...blobs]);
}

const fromSyncMessage = async (blob: Blob): Promise<{ obs: Array<MapObject>, grid: Grid }> => {
    let obs: Array<MapObject> = [];
    const grid = await fromGridMessage(blob);
    let objectBlob = blob.slice(8);
    while (objectBlob.size > 0) {
        const ob: Partial<MapObject> = {};
        const next = await unpackSyncMessage(objectBlob, ob);
        obs.push(ob as MapObject);
        objectBlob = objectBlob.slice(next);
    }
    return { obs, grid };
}

const unpackSyncMessage = async (blob: Blob, ob: Partial<MapObject>): Promise<number> => {
    const buffer = await blob.slice(0, OBJECT_HEADER_LENGTH).arrayBuffer();
    const header = new DataView(buffer);
    const dataLength = header.getInt32(4 + DATA_IDX * 4);
    const data = await blob.slice(OBJECT_HEADER_LENGTH, OBJECT_HEADER_LENGTH + dataLength);
    const mask = header.getUint32(0);
    NUMBER_FIELDS.forEach((field, idx) => {
        if (mask & (1 << idx)) {
            ob[field] = header.getInt32(4 + idx * 4) as (number & Blob);
        }
    });
    if (mask & (1 << DATA_IDX)) {
        ob.data = data;
    }

    return dataLength + OBJECT_HEADER_LENGTH;
}


