
interface MapAsset {
    url: string;
    rescaleX: number;
    rescaleY: number;
    category?: MapAssetCategory;
};

export type MapAssetCategory = 'rock' | 'tree' | 'plant';

const MapAsset = {
    KO1: {
        url: '/assets/mapgen/ko1.png',
        rescaleX: 16,
        rescaleY: 16,
        category: 'rock',
    },
    KO2: {
        url: '/assets/mapgen/ko2.png',
        rescaleX: 12,
        rescaleY: 16,
        category: 'rock',
    },
    KO3: {
        url: '/assets/mapgen/ko3.png',
        rescaleX: 16,
        rescaleY: 13,
        category: 'rock',
    },

    BOKOR1: {
        url: '/assets/mapgen/bokor1.png',
        rescaleX: 30,
        rescaleY: 32,
        category: 'plant'
    },
    BOKOR2: {
        url: '/assets/mapgen/bokor2.png',
        rescaleX: 32,
        rescaleY: 31,
        category: 'plant'
    },
    FA2: {
        url: '/assets/mapgen/fa2.png',
        rescaleX: 128,
        rescaleY: 119,
        category: 'tree',
    },
    FA3: {
        url: '/assets/mapgen/fa3.png',
        rescaleX: 124,
        rescaleY: 128,
        category: 'tree',
    },
    FA4: {
        url: '/assets/mapgen/fa4.png',
        rescaleX: 74,
        rescaleY: 128,
        category: 'tree',
    },
    GRASS: {
        url: '/assets/mapgen/grass.png',
        rescaleX: 250,
        rescaleY: 175
    },
    DIRT: {
        url: '/assets/mapgen/dirt.png',
        rescaleX: 75,
        rescaleY: 75
    },
    DIRTROAD: {
        url: '/assets/mapgen/dirtroad.jpg',
        rescaleX: 455,
        rescaleY: 364
    }
} as Record<string, MapAsset>;

export type MapAssetKey = keyof typeof MapAsset;

export const drawMapAsset = async (category: MapAssetCategory, drawFn: (bitmaps: Array<ImageBitmap>) => unknown) => {
    const assets = Object.values(MapAsset).filter(asset => asset.category === category).map(async asset => await createImageBitmap(await (await fetch(asset.url)).blob(), {
        resizeWidth: asset.rescaleX,
        resizeHeight: asset.rescaleY
    }));
    const bitmaps = await Promise.all(assets);

    await drawFn(bitmaps);
    bitmaps.forEach(bitmap => bitmap.close());
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

