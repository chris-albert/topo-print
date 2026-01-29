import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TerrainMeshOptions, Triangle } from '@topo-print/stl-utils';
import { buildTerrainMesh } from '@topo-print/stl-utils';
import { buildFeatureMesh } from '../../lib/feature-mesh';
import type { Bounds } from '../../lib/elevation-api';

interface TerrainPreviewProps {
  elevationData: number[][];
  modelWidth: number;
  verticalScale: number;
  baseHeight: number;
  buildingScale?: number;
  buildings?: GeoJSON.Feature[] | null;
  roads?: GeoJSON.Feature[] | null;
  bounds?: Bounds | null;
}

function trianglesToBufferGeometry(triangles: Triangle[], center: THREE.Vector3): THREE.BufferGeometry {
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
  geo.translate(-center.x, -center.y, -center.z);

  return geo;
}

function TerrainMesh({ elevationData, modelWidth, verticalScale, baseHeight, buildingScale = 1, buildings, roads, bounds }: TerrainPreviewProps) {
  const { terrainGeo, buildingGeo, roadGeo } = useMemo(() => {
    const grid = {
      data: elevationData,
      rows: elevationData.length,
      cols: elevationData[0].length,
    };

    const options: TerrainMeshOptions = {
      width: modelWidth,
      depth: modelWidth,
      verticalScale,
      baseHeight,
    };

    const terrainTriangles = buildTerrainMesh(grid, options);

    // Compute center from terrain for consistent centering
    const terrainPositions = new Float32Array(terrainTriangles.length * 9);
    for (let i = 0; i < terrainTriangles.length; i++) {
      const tri = terrainTriangles[i];
      const offset = i * 9;
      for (let v = 0; v < 3; v++) {
        terrainPositions[offset + v * 3] = tri.vertices[v].x;
        terrainPositions[offset + v * 3 + 1] = tri.vertices[v].z;
        terrainPositions[offset + v * 3 + 2] = -tri.vertices[v].y;
      }
    }

    const tempGeo = new THREE.BufferGeometry();
    tempGeo.setAttribute('position', new THREE.BufferAttribute(terrainPositions, 3));
    tempGeo.computeBoundingBox();
    const center = new THREE.Vector3();
    tempGeo.boundingBox!.getCenter(center);
    tempGeo.dispose();

    const tGeo = trianglesToBufferGeometry(terrainTriangles, center);

    let bGeo: THREE.BufferGeometry | null = null;
    let rGeo: THREE.BufferGeometry | null = null;

    if (bounds) {
      const featureOpts = {
        width: modelWidth,
        depth: modelWidth,
        baseHeight,
        verticalScale,
        buildingScale,
      };

      const buildingFeatures = buildings ?? [];
      const roadFeatures = roads ?? [];

      if (buildingFeatures.length > 0) {
        const buildingTriangles = buildFeatureMesh(buildingFeatures, [], bounds, elevationData, featureOpts);
        if (buildingTriangles.length > 0) {
          bGeo = trianglesToBufferGeometry(buildingTriangles, center);
        }
      }

      if (roadFeatures.length > 0) {
        const roadTriangles = buildFeatureMesh([], roadFeatures, bounds, elevationData, featureOpts);
        if (roadTriangles.length > 0) {
          rGeo = trianglesToBufferGeometry(roadTriangles, center);
        }
      }
    }

    return { terrainGeo: tGeo, buildingGeo: bGeo, roadGeo: rGeo };
  }, [elevationData, modelWidth, verticalScale, baseHeight, buildingScale, buildings, roads, bounds]);

  return (
    <group>
      <mesh geometry={terrainGeo}>
        <meshStandardMaterial color="#4ade80" flatShading />
      </mesh>
      {buildingGeo && (
        <mesh geometry={buildingGeo}>
          <meshStandardMaterial color="#94a3b8" flatShading />
        </mesh>
      )}
      {roadGeo && (
        <mesh geometry={roadGeo}>
          <meshStandardMaterial color="#64748b" flatShading />
        </mesh>
      )}
    </group>
  );
}

export function TerrainPreview(props: TerrainPreviewProps) {
  return (
    <Canvas camera={{ position: [0, 60, 60], fov: 45 }} style={{ background: '#0f172a' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 100, 50]} intensity={1.2} />
      <TerrainMesh {...props} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.12}
        minDistance={5}
        maxDistance={300}
        zoomSpeed={1.2}
        panSpeed={0.8}
        rotateSpeed={0.6}
      />
    </Canvas>
  );
}
