export interface MapObjectBase {
    id: string;
    x: number;
    y: number;
    zoom: number;
    angle: number;
}

export interface Bitmap extends MapObjectBase {
    type: 'bitmap';
    url: string;
}

export type MapObject = Bitmap;
