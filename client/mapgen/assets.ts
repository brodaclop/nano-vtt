
interface MapAsset {
    url: string;
    rescaleX: number;
    rescaleY: number;
    category?: MapAssetCategory;
};

export type MapAssetCategory = 'rock' | 'tree' | 'plant';

const MapAsset = {
    ROCK: {
        url: '/assets/mapgen/rock.png',
        rescaleX: 32,
        rescaleY: 32,
        category: 'rock',
    },
    PLANT: {
        url: '/assets/mapgen/plant.png',
        rescaleX: 16,
        rescaleY: 16,
        category: 'plant'
    },
    TREE: {
        url: '/assets/mapgen/tree.png',
        rescaleX: 48,
        rescaleY: 48,
        category: 'tree',
    },
    TREE2: {
        url: '/assets/mapgen/tree2.png',
        rescaleX: 48,
        rescaleY: 48,
        category: 'tree',
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

