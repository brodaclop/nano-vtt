import { ChatMessage, Grid, HelloMessage, JoinMessage, MapObject, WorldObject } from "./types/map-objects";

const NUMBER_FIELDS: Array<keyof MapObject> = ['id', 'x', 'y', 'zoom', 'layer', 'locked', 'angle'];

export const ALL_FIELDS: Array<keyof MapObject> = [...NUMBER_FIELDS, 'data'];

const DATA_IDX = NUMBER_FIELDS.length;
const OBJECT_HEADER_LENGTH = NUMBER_FIELDS.length * 4 + 8;

const CHAT_FIELDS = ['id', 'sender'] as const satisfies Array<string>;
const GRID_FIELDS = ['size', 'strength'] as const satisfies Array<string>;
const TYPING_FIELDS = ['sender'] as const satisfies Array<string>;
const JOIN_FIELDS = ['sender'] as const satisfies Array<string>;
const HELLO_FIELDS = ['sender'] as const satisfies Array<string>;

const unpackSimpleBlob = async <T extends string>(blob: Blob, descriptor: Array<T>): Promise<Record<T, number> & { text: string }> => {
    const buffer = await blob.slice(0, descriptor.length * 4).arrayBuffer();
    const header = new DataView(buffer);
    const fields: Record<T, number> = {} as Record<T, number>;
    descriptor.forEach((d, idx) => {
        fields[d] = header.getInt32(idx * 4);
    });
    const text = await blob.slice(descriptor.length * 4).text();
    return { ...fields, text }
}

const packSimpleBlob = <T extends string>(ob: Record<T, number>, descriptor: Array<T>, text?: string): Blob => {
    const buffer = new ArrayBuffer(descriptor.length * 4);
    const header = new DataView(buffer);
    descriptor.forEach((d, idx) => {
        header.setInt32(idx * 4, ob[d]);
    });
    if (text !== undefined) {
        return new Blob([header, text]);
    } else {
        return new Blob([header]);
    }
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

export const Converter = {
    object: {
        from: async (blob: Blob): Promise<Partial<MapObject> | { deletedId: number }> => {
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
        },
        to: (ob: MapObject, fields: Array<keyof MapObject>, deleteFlag = false): Blob => {
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
    },
    chat: {
        from: async (blob: Blob): Promise<ChatMessage> => {
            return await unpackSimpleBlob(blob, CHAT_FIELDS);

        },
        to: (message: ChatMessage) => {
            return packSimpleBlob(message, CHAT_FIELDS, message.text);
        }
    },
    grid: {
        from: async (blob: Blob): Promise<Grid> => {
            return await unpackSimpleBlob(blob, GRID_FIELDS);
        },
        to: (grid: Grid): Blob => {
            return packSimpleBlob(grid, GRID_FIELDS);
        }
    },
    sync: {
        from: async (blob: Blob): Promise<WorldObject> => {
            let objects: Array<MapObject> = [];
            const grid = await Converter.grid.from(blob);
            let objectBlob = blob.slice(8);
            while (objectBlob.size > 0) {
                const ob: Partial<MapObject> = {};
                const next = await unpackSyncMessage(objectBlob, ob);
                objects.push(ob as MapObject);
                objectBlob = objectBlob.slice(next);
            }
            return { objects, grid };
        },
        to: (obs: Array<MapObject>, grid: Grid): Blob => {
            const blobs = obs.map(ob => Converter.object.to(ob, ALL_FIELDS));
            return new Blob([Converter.grid.to(grid), ...blobs]);
        }
    },
    typing: {
        from: async (blob: Blob): Promise<number> => {
            return (await unpackSimpleBlob(blob, TYPING_FIELDS)).sender;
        },
        to: (me: number) => {
            return packSimpleBlob({ sender: me }, TYPING_FIELDS);
        }
    },
    join: {
        from: async (blob: Blob): Promise<JoinMessage> => {
            const { sender, text } = await unpackSimpleBlob(blob, JOIN_FIELDS);
            const [room, name] = text.split(' | ');
            return { sender, room, name };
        },
        to: (message: JoinMessage) => {
            return packSimpleBlob(message, JOIN_FIELDS, `${message.room.replaceAll(' | ', '')} | ${message.name.replaceAll(' | ', '')}`);
        }
    },
    hello: {
        from: async (blob: Blob): Promise<HelloMessage> => {
            const { sender, text: name } = await unpackSimpleBlob(blob, HELLO_FIELDS);
            return { sender, name };
        },
        to: (message: HelloMessage) => {
            return packSimpleBlob(message, HELLO_FIELDS, message.name);
        }
    }


}