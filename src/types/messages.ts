import { MapObject } from "./map-objects";

export interface UpdateObjectsMessage {
    type: 'set-object',
    set: Array<Partial<MapObject> & Pick<MapObject, 'id'>>;
    remove: Array<MapObject['id']>;
}

export type Message = UpdateObjectsMessage;