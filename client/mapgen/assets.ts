
interface MapAsset {
    url: string;
    rescaleX: number;
    rescaleY: number;
};

const MapAsset = {
    ROCK: {
        url: '/assets/mapgen/rock.png',
        rescaleX: 32,
        rescaleY: 32,
    },
    PLANT: {
        url: '/assets/mapgen/plant.png',
        rescaleX: 16,
        rescaleY: 16,
    },
    TREE: {
        url: '/assets/mapgen/tree.png',
        rescaleX: 64,
        rescaleY: 64,
    },
    GRASS: {
        url: '/assets/mapgen/grass.webp',
        rescaleX: 250,
        rescaleY: 175
    },
    DIRT: {
        url: '/assets/mapgen/dirt.jpg',
        rescaleX: 75,
        rescaleY: 75
    },
    DIRTROAD: {
        url: '/assets/mapgen/dirtroad.jpg',
        rescaleX: 455,
        rescaleY: 364
    }
} satisfies Record<string, MapAsset>;

export type MapAssetKey = keyof typeof MapAsset;

export const drawMapAsset = async (key: MapAssetKey, drawFn: (bitmap: ImageBitmap) => unknown) => {
    const asset = MapAsset[key];
    const bitmap = await createImageBitmap(await (await fetch(asset.url)).blob(), {
        resizeWidth: asset.rescaleX,
        resizeHeight: asset.rescaleY
    });
    await drawFn(bitmap);
    bitmap.close();
}
export const drawTile = async (key: MapAssetKey, size: number) => {
    const asset = MapAsset[key];
    const bitmapContext = new OffscreenCanvas(size, size).getContext('2d')!;
    const bitmap = await createImageBitmap(await (await fetch(asset.url)).blob(), {
        resizeWidth: asset.rescaleX,
        resizeHeight: asset.rescaleY
    });

    for (let x = 0; x < size; x += bitmap.width) {
        for (let y = 0; y < size; y += bitmap.height) {
            bitmapContext.drawImage(bitmap, x, y);
        }
    }
    bitmap.close();
    return bitmapContext.getImageData(0, 0, size, size);
}

