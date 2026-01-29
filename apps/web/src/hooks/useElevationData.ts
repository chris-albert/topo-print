import { useState, useCallback, useRef } from 'react';
import { fetchElevationGrid, type Bounds } from '../lib/elevation-api';

export function useElevationData() {
  const [data, setData] = useState<number[][] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (bounds: Bounds, gridSize: number, mapboxToken: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setData(null);

    try {
      const grid = await fetchElevationGrid(
        bounds,
        gridSize,
        mapboxToken,
        setProgress,
        controller.signal,
      );
      setData(grid);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch elevation data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, progress, fetch };
}
