import { useState, useCallback } from 'react';
import { buildTerrainMesh, serializeBinarySTL, downloadSTL } from '@topo-print/stl-utils';
import type { TerrainMeshOptions } from '@topo-print/stl-utils';

export function useStlGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    (elevationData: number[][], options?: TerrainMeshOptions) => {
      setIsGenerating(true);

      // Use requestAnimationFrame to let the UI update before heavy computation
      requestAnimationFrame(() => {
        try {
          const grid = {
            data: elevationData,
            rows: elevationData.length,
            cols: elevationData[0].length,
          };

          const triangles = buildTerrainMesh(grid, options);
          const buffer = serializeBinarySTL(triangles);
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
