export interface MapAsset {
    url: string;
    rescaleSize: number;
};

const MapAsset = {
    ROCK: {
        url: '/assets/mapgen/rock.png',
        rescaleSize: 32,
    },
    PLANT: {
        url: '/assets/mapgen/plant.png',
        rescaleSize: 16,
    },
    TREE: {
        url: '/assets/mapgen/tree.png',
        rescaleSize: 64,
    },
} satisfies Record<string, MapAsset>;

export type MapAssetKey = keyof typeof MapAsset;

export const drawMapAsset = async (key: MapAssetKey, drawFn: (bitmap: ImageBitmap) => unknown) => {
    const asset = MapAsset[key];
    const bitmap = await createImageBitmap(await (await fetch(asset.url)).blob(), {
        resizeWidth: asset.rescaleSize,
        resizeHeight: asset.rescaleSize
    });
    await drawFn(bitmap);
    bitmap.close();
}