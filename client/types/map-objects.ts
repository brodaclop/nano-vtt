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

