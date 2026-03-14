export interface HeaderRecord<T> {
    key: keyof T,
    length: 1 | 2 | 4;
    signed: boolean;
}

export type Header<T> = Array<HeaderRecord<T>>;

const accessor = (length: 1 | 2 | 4, signed: boolean, mode: 'get' | 'set'): keyof DataView => {
   return `${mode}${signed ? 'Uint' : 'Int'}${length * 8}` as keyof DataView; 
}

export const toBinary = <T>(ob: T, header: Header<T>): Blob => {
    const length = header.reduce((acc, curr) => acc + curr.length, 0);
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    let p = 0;
    header.forEach(field => {
        (view[accessor(field.length, field.signed, 'set')] as any)(p, ob[field.key] as number);
        p += field.length;
    });
    return new Blob([buffer]);
}

export const fromBinary = async <T>(blob: Blob, header: Header<T>): Promise<[T, Blob]> => {
    const ob: T = {} as T;
    const length = header.reduce((acc, curr) => acc + curr.length, 0);
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);
    let p = 0;
    header.forEach(field => {
        ob[field.key] = (view[accessor(field.length, field.signed, 'get')] as any)(p);
        p += field.length;
    });
    return [ob, blob.slice(length)];
}