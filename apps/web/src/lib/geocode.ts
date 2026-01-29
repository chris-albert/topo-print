/** Geocode an address using the Mapbox Geocoding API. Returns [lng, lat] or null. */
export async function geocodeAddress(
  address: string,
  token: string,
): Promise<[number, number] | null> {
  const encoded = encodeURIComponent(address.trim());
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const [lng, lat] = feature.center as [number, number];
  return [lng, lat];
}

/** Ray-casting point-in-polygon test. Coordinates are [lng, lat] rings. */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** Find the building feature whose polygon contains the given point. */
export function findBuildingAtPoint(
  buildings: GeoJSON.Feature[],
  lng: number,
  lat: number,
): GeoJSON.Feature | null {
  for (const feature of buildings) {
    const geom = feature.geometry;
    if (geom.type === 'Polygon') {
      if (pointInRing(lng, lat, geom.coordinates[0])) return feature;
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        if (pointInRing(lng, lat, polygon[0])) return feature;
      }
    }
  }
  return null;
}
