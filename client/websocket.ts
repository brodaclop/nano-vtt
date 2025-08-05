import { updateObject } from "./screen";
import { MapObject } from "./types/map-objects";

const HOST_PORT = new URL(window.location.href);

export const socket = new WebSocket(`ws://${HOST_PORT.host}/api`);
export let socketOpen = false;

socket.addEventListener("open", (event) => {
    console.log('socket opened');
    socketOpen = true;
});

socket.addEventListener('close', () => {
    console.log('socket closed');
    socketOpen = false;
});

// Listen for messages
socket.addEventListener("message", async (event) => {
    console.log("Message from server ", event.data);
    const ob = await fromMessage(event.data);
    updateObject(ob);
});

export const send = (ob: MapObject, fields: Array<keyof MapObject>) => {
    if (!socketOpen) {
        console.warn('Failed to send message, socket is closed');
        return;
    }
    socket.send(toMessage(ob, fields));
}

const OBJECT_FIELDS: Array<keyof MapObject> = ['id', 'x', 'y', 'zoom', 'angle'];

const DATA_IDX = OBJECT_FIELDS.length;
const HEADER_LENGTH = OBJECT_FIELDS.length * 4 + 8;


const toMessage = (ob: MapObject, fields: Array<keyof MapObject>): Blob => {
    // TODO: idx should always be included
    const buffer = new ArrayBuffer(HEADER_LENGTH);
    const header = new DataView(buffer);
    let mask = 0;
    OBJECT_FIELDS.forEach((field, idx) => {
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

const fromMessage = async (blob: Blob): Promise<Partial<MapObject>> => {
    const ob: Partial<MapObject> = {};
    const buffer = await blob.slice(0, HEADER_LENGTH).arrayBuffer();
    const header = new DataView(buffer);
    const data = await blob.slice(HEADER_LENGTH);
    const mask = header.getUint32(0);
    OBJECT_FIELDS.forEach((field, idx) => {
        if (mask & (1 << idx)) {
            ob[field] = header.getInt32(4 + idx * 4) as (number & Blob);
        }
    });
    if (mask & (1 << DATA_IDX)) {
        ob.data = data;
    }

    console.log('data', ob.data);

    return ob;
}

