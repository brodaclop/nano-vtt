import { Point } from "../utils/point";

export interface MapObject {
    id: number;
    x: number;
    y: number;
    zoom: number;
    angle: number;
    layer: number; //uint32
    locked: number;
    data: Blob;
}

export interface Grid {
    size: number;
    strength: number;
}

export interface FogCircle {
    originX: number;
    originY: number;
    radius: number;
    reverted: number;
    owner: number;
}

export interface WorldObject { objects: Array<MapObject>, grid: Grid, fog: Array<FogCircle> };

export interface ChatMessage {
    id: number;
    sender: number;
    text: string;
}

export interface JoinMessage {
    sender: number;
    room: string;
    name: string;
}

export interface HelloMessage {
    sender: number;
    name: string;
}
