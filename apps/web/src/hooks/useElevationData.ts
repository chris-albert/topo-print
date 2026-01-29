import { useState, useCallback, useRef } from 'react';
import { fetchElevationGrid, type Bounds } from '../lib/elevation-api';
import { fetchBuildingsAndRoads, type VectorFeatures } from '../lib/vector-tile-api';

export function useElevationData() {
  const [data, setData] = useState<number[][] | null>(null);
  const [buildings, setBuildings] = useState<GeoJSON.Feature[] | null>(null);
  const [roads, setRoads] = useState<GeoJSON.Feature[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (
    bounds: Bounds,
    gridSize: number,
    mapboxToken: string,
    enableBuildings: boolean = false,
    enableRoads: boolean = false,
  ) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setData(null);
    setBuildings(null);
    setRoads(null);

    const fetchVector = enableBuildings || enableRoads;

    try {
      // Fetch elevation and vector tiles in parallel
      const elevationPromise = fetchElevationGrid(
        bounds,
        gridSize,
        mapboxToken,
        (p) => {
          // Elevation gets first 80% (or 100% if no vector fetch)
          const share = fetchVector ? 0.8 : 1.0;
          setProgress(Math.round(p * share));
        },
        controller.signal,
      );

      let vectorPromise: Promise<VectorFeatures | null> = Promise.resolve(null);
      if (fetchVector) {
        vectorPromise = fetchBuildingsAndRoads(
          bounds,
          mapboxToken,
          (p) => {
            // Vector gets last 20%
            setProgress((prev) => Math.max(prev, 80 + Math.round(p * 0.2)));
          },
          controller.signal,
        );
      }

      const [grid, vectorData] = await Promise.all([elevationPromise, vectorPromise]);

      setData(grid);
      if (vectorData) {
        if (enableBuildings) setBuildings(vectorData.buildings);
        if (enableRoads) setRoads(vectorData.roads);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch elevation data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, buildings, roads, isLoading, error, progress, fetch };
}
