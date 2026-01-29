import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import { latLngToTile, type Bounds } from './elevation-api';

const vectorTileCache = new Map<string, VectorTile>();

async function fetchVectorTile(
  x: number,
  y: number,
  z: number,
  token: string,
  signal?: AbortSignal,
): Promise<VectorTile> {
  const key = `${z}/${x}/${y}`;
  const cached = vectorTileCache.get(key);
  if (cached) return cached;

  const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${z}/${x}/${y}.mvt?access_token=${token}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Mapbox token. Please check your access token.');
    }
    throw new Error(`Vector tile fetch error: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const tile = new VectorTile(new Pbf(buffer));
  vectorTileCache.set(key, tile);
  return tile;
}

export interface VectorFeatures {
  buildings: GeoJSON.Feature[];
  roads: GeoJSON.Feature[];
}

export async function fetchBuildingsAndRoads(
  bounds: Bounds,
  token: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<VectorFeatures> {
  const zoom = 15;

  const topLeft = latLngToTile(bounds.north, bounds.west, zoom);
  const bottomRight = latLngToTile(bounds.south, bounds.east, zoom);

  const tileCoords: { x: number; y: number }[] = [];
  for (let tx = topLeft.x; tx <= bottomRight.x; tx++) {
    for (let ty = topLeft.y; ty <= bottomRight.y; ty++) {
      tileCoords.push({ x: tx, y: ty });
    }
  }

  const buildings: GeoJSON.Feature[] = [];
  const roads: GeoJSON.Feature[] = [];
  let fetchedCount = 0;
  const totalTiles = tileCoords.length;

  const fetchPromises = tileCoords.map(async ({ x, y }) => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const tile = await fetchVectorTile(x, y, zoom, token, signal);

    const buildingLayer = tile.layers['building'];
    if (buildingLayer) {
      for (let i = 0; i < buildingLayer.length; i++) {
        const feature = buildingLayer.feature(i);
        const geojson = feature.toGeoJSON(x, y, zoom);
        if (featureIntersectsBounds(geojson, bounds)) {
          buildings.push(geojson);
        }
      }
    }

    const roadLayer = tile.layers['road'];
    if (roadLayer) {
      for (let i = 0; i < roadLayer.length; i++) {
        const feature = roadLayer.feature(i);
        const geojson = feature.toGeoJSON(x, y, zoom);
        if (featureIntersectsBounds(geojson, bounds)) {
          roads.push(geojson);
        }
      }
    }

    fetchedCount++;
    onProgress?.(Math.round((fetchedCount / totalTiles) * 100));
  });

  await Promise.all(fetchPromises);

  return { buildings, roads };
}

function featureIntersectsBounds(feature: GeoJSON.Feature, bounds: Bounds): boolean {
  const coords = extractCoordinates(feature.geometry);
  if (coords.length === 0) return false;

  // Check if any coordinate falls within bounds
  for (const [lng, lat] of coords) {
    if (lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east) {
      return true;
    }
  }

  return false;
}

function extractCoordinates(geometry: GeoJSON.Geometry): number[][] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'MultiPoint':
    case 'LineString':
      return geometry.coordinates;
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    default:
      return [];
  }
}
