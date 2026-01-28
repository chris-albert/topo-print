interface ElevationResponse {
  elevation: number[];
}

const MAX_RETRIES = 3;
const API_URL = 'https://api.open-meteo.com/v1/elevation';

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
  attempt = 0,
): Promise<Response> {
  const response = await fetch(url, { ...init, signal });

  if (response.status === 429 && attempt < MAX_RETRIES) {
    // Exponential backoff: 2s, 4s, 8s
    const delay = 2000 * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, init, signal, attempt + 1);
  }

  return response;
}

export async function fetchElevations(
  latitudes: number[],
  longitudes: number[],
  signal?: AbortSignal,
): Promise<number[]> {
  // Use POST to avoid URL length limits
  const body = new URLSearchParams();
  body.set('latitude', latitudes.join(','));
  body.set('longitude', longitudes.join(','));

  const response = await fetchWithRetry(API_URL, {
    method: 'POST',
    body,
  }, signal);

  if (!response.ok) {
    throw new Error(`Elevation API error: ${response.status} ${response.statusText}`);
  }
  const data: ElevationResponse = await response.json();
  return data.elevation;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function fetchElevationGrid(
  bounds: Bounds,
  gridSize: number,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<number[][]> {
  const latitudes: number[] = [];
  const longitudes: number[] = [];

  // Generate grid points
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const lat = bounds.north - (r / (gridSize - 1)) * (bounds.north - bounds.south);
      const lng = bounds.west + (c / (gridSize - 1)) * (bounds.east - bounds.west);
      // Round to 4 decimal places (~11m precision, plenty for 90m DEM)
      latitudes.push(Math.round(lat * 10000) / 10000);
      longitudes.push(Math.round(lng * 10000) / 10000);
    }
  }

  const totalPoints = latitudes.length;
  // POST body has no URL length limit, so we can use large batches.
  // 1000 coords per batch = only 3 requests for a 50x50 grid.
  const batchSize = 1000;
  const allElevations: number[] = [];

  for (let i = 0; i < totalPoints; i += batchSize) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const batchLats = latitudes.slice(i, i + batchSize);
    const batchLngs = longitudes.slice(i, i + batchSize);

    const elevations = await fetchElevations(batchLats, batchLngs, signal);
    allElevations.push(...elevations);

    onProgress?.(Math.min(100, ((i + batchSize) / totalPoints) * 100));

    // Delay between batches to avoid rate limits (600 req/min free tier)
    if (i + batchSize < totalPoints) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // Reshape into 2D grid
  const grid: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    grid.push(allElevations.slice(r * gridSize, (r + 1) * gridSize));
  }

  return grid;
}
