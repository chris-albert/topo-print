export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Convert lat/lng to tile coordinates at a given zoom level */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/** Convert tile pixel coordinates back to lat/lng */
function tilePixelToLatLng(
  tileX: number,
  tileY: number,
  pixelX: number,
  pixelY: number,
  zoom: number,
  tileSize: number,
): { lat: number; lng: number } {
  const n = Math.pow(2, zoom);
  const lng = ((tileX + pixelX / tileSize) / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (tileY + pixelY / tileSize)) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

/** Decode RGB pixel values to elevation in meters */
function decodeElevation(r: number, g: number, b: number): number {
  return -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
}

// Tile cache to avoid re-fetching the same tile
const tileCache = new Map<string, ImageData>();

/** Fetch a Mapbox Terrain RGB tile and return its ImageData */
async function fetchTerrainTile(
  x: number,
  y: number,
  z: number,
  token: string,
  signal?: AbortSignal,
): Promise<ImageData> {
  const key = `${z}/${x}/${y}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/${z}/${x}/${y}@2x.pngraw?access_token=${token}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Mapbox token. Please check your access token.');
    }
    throw new Error(`Terrain tile fetch error: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  bitmap.close();

  tileCache.set(key, imageData);
  return imageData;
}

/** Pick a zoom level based on the selection bounds */
function pickZoom(bounds: Bounds): number {
  const latSpan = bounds.north - bounds.south;
  const lngSpan = bounds.east - bounds.west;
  const maxSpan = Math.max(latSpan, lngSpan);

  // Aim for a zoom where the selection is covered by a small number of tiles
  // Higher zoom = more detail but more tiles
  if (maxSpan > 5) return 8;
  if (maxSpan > 2) return 9;
  if (maxSpan > 1) return 10;
  if (maxSpan > 0.5) return 11;
  if (maxSpan > 0.2) return 12;
  if (maxSpan > 0.05) return 13;
  return 14;
}

/** Get elevation for a specific lat/lng from tile image data */
function getElevationFromTile(
  lat: number,
  lng: number,
  zoom: number,
  tileSize: number,
  tiles: Map<string, ImageData>,
): number {
  const n = Math.pow(2, zoom);

  // Fractional tile coordinates
  const tileXFloat = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const tileYFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const tileX = Math.floor(tileXFloat);
  const tileY = Math.floor(tileYFloat);

  // Pixel within the tile
  const pixelX = Math.floor((tileXFloat - tileX) * tileSize);
  const pixelY = Math.floor((tileYFloat - tileY) * tileSize);

  const key = `${zoom}/${tileX}/${tileY}`;
  const imageData = tiles.get(key);
  if (!imageData) return 0;

  // Clamp to tile bounds
  const px = Math.min(pixelX, tileSize - 1);
  const py = Math.min(pixelY, tileSize - 1);

  const idx = (py * tileSize + px) * 4;
  const r = imageData.data[idx];
  const g = imageData.data[idx + 1];
  const b = imageData.data[idx + 2];

  return decodeElevation(r, g, b);
}

export async function fetchElevationGrid(
  bounds: Bounds,
  gridSize: number,
  token: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<number[][]> {
  const zoom = pickZoom(bounds);
  const tileSize = 512; // @2x tiles are 512x512

  // Determine which tiles cover the bounds
  const topLeft = latLngToTile(bounds.north, bounds.west, zoom);
  const bottomRight = latLngToTile(bounds.south, bounds.east, zoom);

  const minTileX = topLeft.x;
  const maxTileX = bottomRight.x;
  const minTileY = topLeft.y;
  const maxTileY = bottomRight.y;

  // Collect tile coordinates
  const tileCoords: { x: number; y: number }[] = [];
  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      tileCoords.push({ x: tx, y: ty });
    }
  }

  // Fetch all needed tiles
  const tiles = new Map<string, ImageData>();
  let fetchedCount = 0;
  const totalTiles = tileCoords.length;

  // Fetch tiles in parallel (small number, usually 1-9)
  const fetchPromises = tileCoords.map(async ({ x, y }) => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const imageData = await fetchTerrainTile(x, y, zoom, token, signal);
    tiles.set(`${zoom}/${x}/${y}`, imageData);
    fetchedCount++;
    onProgress?.(Math.round((fetchedCount / totalTiles) * 50)); // First 50% is tile fetching
  });

  await Promise.all(fetchPromises);

  // Build elevation grid by sampling the tiles
  const grid: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const row: number[] = [];
    const lat = bounds.north - (r / (gridSize - 1)) * (bounds.north - bounds.south);

    for (let c = 0; c < gridSize; c++) {
      const lng = bounds.west + (c / (gridSize - 1)) * (bounds.east - bounds.west);
      const elevation = getElevationFromTile(lat, lng, zoom, tileSize, tiles);
      row.push(elevation);
    }
    grid.push(row);

    // Second 50% is grid sampling progress
    onProgress?.(50 + Math.round(((r + 1) / gridSize) * 50));
  }

  return grid;
}
