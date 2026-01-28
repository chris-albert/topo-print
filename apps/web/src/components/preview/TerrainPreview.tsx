import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TerrainMeshOptions } from '@topo-print/stl-utils';
import { buildTerrainMesh } from '@topo-print/stl-utils';

interface TerrainPreviewProps {
  elevationData: number[][];
  modelWidth: number;
  verticalScale: number;
  baseHeight: number;
}

function TerrainMesh({ elevationData, modelWidth, verticalScale, baseHeight }: TerrainPreviewProps) {
  const geometry = useMemo(() => {
    const grid = {
      data: elevationData,
      rows: elevationData.length,
      cols: elevationData[0].length,
    };

    const options: TerrainMeshOptions = {
      width: modelWidth,
      depth: modelWidth, // square
      verticalScale,
      baseHeight,
    };

    const triangles = buildTerrainMesh(grid, options);

    const positions = new Float32Array(triangles.length * 9);
    const normals = new Float32Array(triangles.length * 9);

    for (let i = 0; i < triangles.length; i++) {
      const tri = triangles[i];
      const offset = i * 9;

      for (let v = 0; v < 3; v++) {
        positions[offset + v * 3] = tri.vertices[v].x;
        positions[offset + v * 3 + 1] = tri.vertices[v].z; // swap Y/Z for Three.js
        positions[offset + v * 3 + 2] = -tri.vertices[v].y;

        normals[offset + v * 3] = tri.normal.x;
        normals[offset + v * 3 + 1] = tri.normal.z;
        normals[offset + v * 3 + 2] = -tri.normal.y;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    // Center the geometry
    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox!.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);

    return geo;
  }, [elevationData, modelWidth, verticalScale, baseHeight]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#4ade80" flatShading />
    </mesh>
  );
}

export function TerrainPreview(props: TerrainPreviewProps) {
  return (
    <Canvas camera={{ position: [0, 80, 80], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 100, 50]} intensity={1} />
      <TerrainMesh {...props} />
      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}
