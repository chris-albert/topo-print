import { useState, useCallback } from 'react';
import { buildTerrainMesh, serializeBinarySTL, downloadSTL } from '@topo-print/stl-utils';
import type { TerrainMeshOptions } from '@topo-print/stl-utils';
import { buildFeatureMesh } from '../lib/feature-mesh';
import type { Bounds } from '../lib/elevation-api';

export interface StlGenerationFeatures {
  buildings?: GeoJSON.Feature[] | null;
  roads?: GeoJSON.Feature[] | null;
  bounds?: Bounds | null;
  elevationGrid?: number[][] | null;
}

export function useStlGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    (elevationData: number[][], options?: TerrainMeshOptions, features?: StlGenerationFeatures) => {
      setIsGenerating(true);

      // Use requestAnimationFrame to let the UI update before heavy computation
      requestAnimationFrame(() => {
        try {
          const grid = {
            data: elevationData,
            rows: elevationData.length,
            cols: elevationData[0].length,
          };

          const terrainTriangles = buildTerrainMesh(grid, options);

          let allTriangles = terrainTriangles;

          if (features?.bounds && features?.elevationGrid) {
            const buildings = features.buildings ?? [];
            const roads = features.roads ?? [];
            if (buildings.length > 0 || roads.length > 0) {
              const featureTriangles = buildFeatureMesh(
                buildings,
                roads,
                features.bounds,
                features.elevationGrid,
                {
                  width: options?.width ?? 100,
                  depth: options?.depth ?? options?.width ?? 100,
                  baseHeight: options?.baseHeight ?? 2,
                  verticalScale: options?.verticalScale ?? 1.5,
                },
              );
              allTriangles = [...terrainTriangles, ...featureTriangles];
            }
          }

          const buffer = serializeBinarySTL(allTriangles);
          downloadSTL(buffer, 'terrain.stl');
        } catch (err) {
          console.error('STL generation failed:', err);
        } finally {
          setIsGenerating(false);
        }
      });
    },
    [],
  );

  return { generate, isGenerating };
}
