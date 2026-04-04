import { ChatMessage, FogCircle, Grid, HelloMessage, JoinMessage, MapObject, WorldObject } from "./types/map-objects";
import { SocketStatus } from "./websocket";

interface WorldChanged {
    type: 'world-changed',
    payload?: never
}

interface RoomChanged {
    type: 'room-changed',
    payload: number[]
}


interface ViewportChanged {
    type: 'viewport-changed',
    payload?: never
}

interface ObjectSelected {
    type: 'object-selected',
    payload: MapObject
}

interface ChatReceived {
    type: 'chat-received',
    payload: ChatMessage
}

interface TypingReceived {
    type: 'typing-received',
    payload: {
        user: number;
        action: 'start' | 'end'
    }
}

interface GridReceived {
    type: 'grid-received',
    payload: Grid
}

interface ObjectDeleteReceived {
    type: 'object-delete-received',
    payload: number
}

interface ObjectReceived {
    type: 'object-received',
    payload: Partial<MapObject>;
}

interface SyncReceived {
    type: 'sync-received',
    payload: WorldObject;
}

interface JoinReceived {
    type: 'join-received',
    payload: JoinMessage
}

interface HelloReceived {
    type: 'hello-received',
    payload: HelloMessage
}

interface MessageReceived {
    type: 'incoming-message',
    payload: Blob;
}

interface SocketStatusChanged {
    type: 'socket-status-changed',
    payload: SocketStatus;
}

interface FogCircleReceived {
    type: 'fog-circle-received',
    payload: FogCircle;
}

interface EditModeChanged {
    type: 'edit-mode-changed',
    payload: 'normal' | 'fog'
}

export type Event =
    | WorldChanged
    | RoomChanged
    | ViewportChanged
    | ObjectSelected
    | ChatReceived
    | TypingReceived
    | GridReceived
    | ObjectDeleteReceived
    | ObjectReceived
    | SyncReceived
    | JoinReceived
    | HelloReceived
    | MessageReceived
    | FogCircleReceived
    | EditModeChanged
    | SocketStatusChanged;

const listeners: Record<Event['type'], Array<(arg: Event['payload']) => unknown>> = {
    'viewport-changed': [],
    'world-changed': [],
    'object-selected': [],
    'chat-received': [],
    'typing-received': [],
    'grid-received': [],
    'object-delete-received': [],
    'object-received': [],
    'sync-received': [],
    'join-received': [],
    'hello-received': [],
    'incoming-message': [],
    'socket-status-changed': [],
    'room-changed': [],
    'fog-circle-received': [],
    'edit-mode-changed': [],
};

function register(type: ViewportChanged['type'], listener: (event: ViewportChanged['payload']) => unknown): void;
function register(type: WorldChanged['type'], listener: (event: WorldChanged['payload']) => unknown): void;
function register(type: RoomChanged['type'], listener: (event: RoomChanged['payload']) => unknown): void;
function register(type: ObjectSelected['type'], listener: (event: ObjectSelected['payload']) => unknown): void;
function register(type: ChatReceived['type'], listener: (event: ChatReceived['payload']) => unknown): void;
function register(type: TypingReceived['type'], listener: (event: TypingReceived['payload']) => unknown): void;
function register(type: GridReceived['type'], listener: (event: GridReceived['payload']) => unknown): void;
function register(type: ObjectDeleteReceived['type'], listener: (event: ObjectDeleteReceived['payload']) => unknown): void;
function register(type: ObjectReceived['type'], listener: (event: ObjectReceived['payload']) => unknown): void;
function register(type: SyncReceived['type'], listener: (event: SyncReceived['payload']) => unknown): void;
function register(type: JoinReceived['type'], listener: (event: JoinReceived['payload']) => unknown): void;
function register(type: HelloReceived['type'], listener: (event: HelloReceived['payload']) => unknown): void;
function register(type: MessageReceived['type'], listener: (event: MessageReceived['payload']) => unknown): void;
function register(type: SocketStatusChanged['type'], listener: (event: SocketStatusChanged['payload']) => unknown): void;
function register(type: FogCircleReceived['type'], listener: (event: FogCircleReceived['payload']) => unknown): void;
function register(type: EditModeChanged['type'], listener: (event: EditModeChanged['payload']) => unknown): void;
function register(type: Event['type'], listener: (event: any) => unknown): void {
    listeners[type].push(listener);
}

function unregister(type: ViewportChanged['type'], listener: (event: ViewportChanged) => unknown): void;
function unregister(type: WorldChanged['type'], listener: (event: WorldChanged) => unknown): void;
function unregister(type: RoomChanged['type'], listener: (event: RoomChanged['payload']) => unknown): void;
function unregister(type: ObjectSelected['type'], listener: (event: ObjectSelected) => unknown): void;
function unregister(type: ChatReceived['type'], listener: (event: ChatReceived['payload']) => unknown): void;
function unregister(type: TypingReceived['type'], listener: (event: TypingReceived['payload']) => unknown): void;
function unregister(type: GridReceived['type'], listener: (event: GridReceived['payload']) => unknown): void;
function unregister(type: ObjectDeleteReceived['type'], listener: (event: ObjectDeleteReceived['payload']) => unknown): void;
function unregister(type: ObjectReceived['type'], listener: (event: ObjectReceived['payload']) => unknown): void;
function unregister(type: SyncReceived['type'], listener: (event: SyncReceived['payload']) => unknown): void;
function unregister(type: JoinReceived['type'], listener: (event: JoinReceived['payload']) => unknown): void;
function unregister(type: HelloReceived['type'], listener: (event: HelloReceived['payload']) => unknown): void;
function unregister(type: MessageReceived['type'], listener: (event: MessageReceived['payload']) => unknown): void;
function unregister(type: SocketStatusChanged['type'], listener: (event: SocketStatusChanged['payload']) => unknown): void;
function unregister(type: FogCircleReceived['type'], listener: (event: FogCircleReceived['payload']) => unknown): void;
function unregister(type: EditModeChanged['type'], listener: (event: EditModeChanged['payload']) => unknown): void;
function unregister(type: Event['type'], listener: (event: any) => unknown): void {
    listeners[type] = listeners[type].filter(l => l !== listener);
}

export const Events = {
    emit: async (event: Event): Promise<void> => {
        console.trace('event', event);
        const ls = listeners[event.type];
        await Promise.all(ls.map(l => l(event.payload)));
    },
    register,
    unregister
};