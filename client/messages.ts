import { ChatMessage, FogCircle, Grid, HelloMessage, JoinMessage, MapObject, RawMapObject, WorldObject } from "./types/map-objects";
import { Socket } from "./websocket";
import { Events } from "./events";
import { ALL_FIELDS, Converter } from "./utils/converters";
import { Toaster } from "./utils/toaster";

enum MessageType {
    PING = 0,
    OBJECT = 1,
    CHAT = 2,
    JOIN_ROOM = 3,
    HELLO = 4,
    SYNC = 5,
    GRID = 6,
    TYPING_START = 7,
    TYPING_END = 8,
    ADD_FOG_CIRCLE = 9
}

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


Events.register('incoming-message', async (data: Blob) => {
    const [type, payload] = await fromMessage(data);
    switch (type) {
        case MessageType.OBJECT: {
            const decoded = await Converter.object.from(payload);
            if ('deletedId' in decoded) {
                await Events.emit({ type: 'object-delete-received', payload: decoded.deletedId });
            } else {
                await Events.emit({ type: 'object-received', payload: decoded });
            }
            return;
        }
        case MessageType.CHAT: {
            await Events.emit({ type: 'chat-received', payload: await Converter.chat.from(payload) });
            return;
        }
        case MessageType.JOIN_ROOM: {
            await Events.emit({ type: 'join-received', payload: await Converter.join.from(payload) })
            return;
        }
        case MessageType.HELLO: {
            await Events.emit({ type: 'hello-received', payload: await Converter.hello.from(payload) })
            return;
        }
        case MessageType.ADD_FOG_CIRCLE: {
            await Events.emit({ type: 'fog-circle-received', payload: await Converter.fogCircle.from(payload) })
            return;
        }
        case MessageType.SYNC: {
            await Events.emit({ type: 'sync-received', payload: await Converter.sync.from(payload) })
            return;
        }
        case MessageType.GRID: {
            await Events.emit({ type: 'grid-received', payload: await Converter.grid.from(payload) });
            return;
        }
        case MessageType.TYPING_START: {
            await Events.emit({ type: 'typing-received', payload: { action: 'start', user: await Converter.typing.from(payload) } })
            return;
        }
        case MessageType.TYPING_END: {
            await Events.emit({ type: 'typing-received', payload: { action: 'end', user: await Converter.typing.from(payload) } })
            return;
        }
        default: Toaster.error(`Unknown message type: ${type}`); return;
    }
});

const send = (messageType: MessageType, blob: Blob) => {
    const payload = toMessage(messageType, blob);
    Socket.send(payload);
}

export const Send = {
    delete: (id: number) => {
        send(MessageType.OBJECT, Converter.object.to({ id } as MapObject, ['id'], true));
    },
    object: (ob: RawMapObject, fields: Array<keyof RawMapObject> = ALL_FIELDS) => {
        send(MessageType.OBJECT, Converter.object.to(ob, fields));
    },
    grid: (grid: Grid) => {
        send(MessageType.GRID, Converter.grid.to(grid));
    },
    chat: (message: ChatMessage) => {
        send(MessageType.CHAT, Converter.chat.to(message))
    },
    typing: (op: 'start' | 'end', me: number) => {
        send(op === 'start' ? MessageType.TYPING_START : MessageType.TYPING_END, Converter.typing.to(me));
    },
    sync: (world: WorldObject) => {
        send(MessageType.SYNC, Converter.sync.to(world));
    },
    join: (message: JoinMessage) => {
        send(MessageType.JOIN_ROOM, Converter.join.to(message));
    },
    hello: (message: HelloMessage) => {
        send(MessageType.HELLO, Converter.hello.to(message));
    },
    addFogCircle: (message: FogCircle) => {
        send(MessageType.ADD_FOG_CIRCLE, Converter.fogCircle.to(message));
    }

}

