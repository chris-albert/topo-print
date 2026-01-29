import earcut from 'earcut';
import { createTriangle } from '@topo-print/stl-utils';
import type { Triangle, Vec3 } from '@topo-print/stl-utils';
import type { Bounds } from './elevation-api';

export interface FeatureMeshOptions {
  width: number;
  depth: number;
  baseHeight: number;
  verticalScale: number;
  buildingScale?: number;
  footprintScale?: number;
  houseShape?: boolean;
}

export function buildFeatureMesh(
  buildings: GeoJSON.Feature[],
  roads: GeoJSON.Feature[],
  bounds: Bounds,
  elevationGrid: number[][],
  options: FeatureMeshOptions,
): Triangle[] {
  const { width, depth, baseHeight, verticalScale, buildingScale = 1, footprintScale = 1, houseShape = false } = options;
  const rows = elevationGrid.length;
  const cols = elevationGrid[0].length;

  // Compute elevation stats (same as terrain-mesh.ts)
  let minElev = Infinity;
  let maxElev = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const e = elevationGrid[r][c];
      if (e < minElev) minElev = e;
      if (e > maxElev) maxElev = e;
    }
  }
  const elevRange = maxElev - minElev;
  const maxTerrainHeight = elevRange === 0 ? 0 : (width * 0.3) * verticalScale;

  function sampleTerrainZ(lat: number, lng: number): number {
    // Same mapping as terrain-mesh getVertex
    const rowF = ((bounds.north - lat) / (bounds.north - bounds.south)) * (rows - 1);
    const colF = ((lng - bounds.west) / (bounds.east - bounds.west)) * (cols - 1);

    const clampedRow = Math.max(0, Math.min(rowF, rows - 1));
    const clampedCol = Math.max(0, Math.min(colF, cols - 1));

    const r0 = Math.min(Math.floor(clampedRow), rows - 2);
    const c0 = Math.min(Math.floor(clampedCol), cols - 2);
    const r1 = r0 + 1;
    const c1 = c0 + 1;
    const rFrac = clampedRow - r0;
    const cFrac = clampedCol - c0;

    // Bilinear interpolation
    const e00 = elevationGrid[r0][c0];
    const e01 = elevationGrid[r0][c1];
    const e10 = elevationGrid[r1][c0];
    const e11 = elevationGrid[r1][c1];

    const rawElev = e00 * (1 - rFrac) * (1 - cFrac) +
                    e01 * (1 - rFrac) * cFrac +
                    e10 * rFrac * (1 - cFrac) +
                    e11 * rFrac * cFrac;

    const normalizedElev = elevRange === 0 ? 0 : (rawElev - minElev) / elevRange;
    return baseHeight + normalizedElev * maxTerrainHeight;
  }

  function geoToModel(lng: number, lat: number): { x: number; y: number } {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * width;
    // Row 0 = north = max Y in terrain-mesh, so lat maps: south=0, north=depth
    const y = ((lat - bounds.south) / (bounds.north - bounds.south)) * depth;
    return { x, y };
  }

  function metersToModelHeight(meters: number): number {
    if (elevRange === 0) {
      // Flat terrain: use a fixed scale based on model width
      return Math.min(meters * (width / 1000), width * 0.1);
    }
    const h = (meters / elevRange) * maxTerrainHeight;
    // Cap to avoid absurdly tall buildings in flat areas
    return Math.min(h, maxTerrainHeight * 0.5);
  }

  const triangles: Triangle[] = [];

  // Process buildings
  for (const feature of buildings) {
    const geom = feature.geometry;
    if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') continue;

    const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    const heightProp = feature.properties?.height;
    const buildingMeters = typeof heightProp === 'number' ? heightProp : 12;
    const modelBuildingHeight = metersToModelHeight(buildingMeters) * buildingScale;

    for (const rings of polygons) {
      const outerRing = rings[0];
      if (!outerRing || outerRing.length < 4) continue;

      // Remove closing vertex (earcut expects open rings)
      const coords = outerRing.slice(0, -1);
      if (coords.length < 3) continue;

      // Convert to model coords and sample terrain
      const modelCoords: { x: number; y: number; terrainZ: number }[] = [];
      for (const [lng, lat] of coords) {
        const { x, y } = geoToModel(lng, lat);
        const terrainZ = sampleTerrainZ(lat, lng);
        modelCoords.push({ x, y, terrainZ });
      }

      // Scale footprint outward from centroid
      if (footprintScale !== 1) {
        const cx = modelCoords.reduce((s, c) => s + c.x, 0) / modelCoords.length;
        const cy = modelCoords.reduce((s, c) => s + c.y, 0) / modelCoords.length;
        for (const c of modelCoords) {
          c.x = cx + (c.x - cx) * footprintScale;
          c.y = cy + (c.y - cy) * footprintScale;
        }
      }

      // Average terrain height for this building (use for a flat roofline)
      const avgTerrainZ = modelCoords.reduce((sum, c) => sum + c.terrainZ, 0) / modelCoords.length;
      const wallTopZ = avgTerrainZ + modelBuildingHeight;

      // Triangulate using earcut
      const flatCoords: number[] = [];
      for (const c of modelCoords) {
        flatCoords.push(c.x, c.y);
      }

      const indices = earcut(flatCoords);

      if (houseShape) {
        // --- Gabled house roof ---
        // Find the oriented bounding box principal axis
        const cx = modelCoords.reduce((s, c) => s + c.x, 0) / modelCoords.length;
        const cy = modelCoords.reduce((s, c) => s + c.y, 0) / modelCoords.length;

        // Find axis-aligned bounding box to determine ridge direction
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const c of modelCoords) {
          if (c.x < minX) minX = c.x;
          if (c.x > maxX) maxX = c.x;
          if (c.y < minY) minY = c.y;
          if (c.y > maxY) maxY = c.y;
        }
        const spanX = maxX - minX;
        const spanY = maxY - minY;
        const roofHeight = modelBuildingHeight * 0.5;
        const ridgeZ = wallTopZ + roofHeight;

        // Ridge runs along the longer axis
        let ridgeStart: Vec3, ridgeEnd: Vec3;
        if (spanX >= spanY) {
          // Ridge along X axis
          ridgeStart = { x: minX, y: cy, z: ridgeZ };
          ridgeEnd = { x: maxX, y: cy, z: ridgeZ };
        } else {
          // Ridge along Y axis
          ridgeStart = { x: cx, y: minY, z: ridgeZ };
          ridgeEnd = { x: cx, y: maxY, z: ridgeZ };
        }

        // Roof faces: for each wall edge, create triangles to the ridge
        for (let i = 0; i < modelCoords.length; i++) {
          const curr = modelCoords[i];
          const next = modelCoords[(i + 1) % modelCoords.length];
          const wallCurr: Vec3 = { x: curr.x, y: curr.y, z: wallTopZ };
          const wallNext: Vec3 = { x: next.x, y: next.y, z: wallTopZ };

          // Project edge midpoint onto ridge to find nearest ridge point
          const edgeMidX = (curr.x + next.x) / 2;
          const edgeMidY = (curr.y + next.y) / 2;
          const ridgeDx = ridgeEnd.x - ridgeStart.x;
          const ridgeDy = ridgeEnd.y - ridgeStart.y;
          const ridgeLen2 = ridgeDx * ridgeDx + ridgeDy * ridgeDy;
          let t = ridgeLen2 > 0
            ? ((edgeMidX - ridgeStart.x) * ridgeDx + (edgeMidY - ridgeStart.y) * ridgeDy) / ridgeLen2
            : 0.5;
          t = Math.max(0, Math.min(1, t));
          const ridgePoint: Vec3 = {
            x: ridgeStart.x + t * ridgeDx,
            y: ridgeStart.y + t * ridgeDy,
            z: ridgeZ,
          };

          triangles.push(createTriangle(wallCurr, wallNext, ridgePoint));
        }

        // Flat top face at wall height (floor of the attic, seals the shape)
        for (let i = 0; i < indices.length; i += 3) {
          const a = modelCoords[indices[i]];
          const b = modelCoords[indices[i + 1]];
          const c = modelCoords[indices[i + 2]];
          triangles.push(createTriangle(
            { x: a.x, y: a.y, z: wallTopZ },
            { x: b.x, y: b.y, z: wallTopZ },
            { x: c.x, y: c.y, z: wallTopZ },
          ));
        }
      } else {
        // --- Flat top ---
        for (let i = 0; i < indices.length; i += 3) {
          const a = modelCoords[indices[i]];
          const b = modelCoords[indices[i + 1]];
          const c = modelCoords[indices[i + 2]];
          triangles.push(createTriangle(
            { x: a.x, y: a.y, z: wallTopZ },
            { x: b.x, y: b.y, z: wallTopZ },
            { x: c.x, y: c.y, z: wallTopZ },
          ));
        }
      }

      // Bottom face (at terrain surface, reversed winding)
      for (let i = 0; i < indices.length; i += 3) {
        const a = modelCoords[indices[i]];
        const b = modelCoords[indices[i + 1]];
        const c = modelCoords[indices[i + 2]];
        triangles.push(createTriangle(
          { x: a.x, y: a.y, z: avgTerrainZ },
          { x: c.x, y: c.y, z: avgTerrainZ },
          { x: b.x, y: b.y, z: avgTerrainZ },
        ));
      }

      // Walls between wall top and bottom edges
      for (let i = 0; i < modelCoords.length; i++) {
        const curr = modelCoords[i];
        const next = modelCoords[(i + 1) % modelCoords.length];

        const topCurr: Vec3 = { x: curr.x, y: curr.y, z: wallTopZ };
        const topNext: Vec3 = { x: next.x, y: next.y, z: wallTopZ };
        const botCurr: Vec3 = { x: curr.x, y: curr.y, z: avgTerrainZ };
        const botNext: Vec3 = { x: next.x, y: next.y, z: avgTerrainZ };

        // Two triangles per wall segment (outward-facing normals)
        triangles.push(createTriangle(topCurr, topNext, botCurr));
        triangles.push(createTriangle(botCurr, topNext, botNext));
      }
    }
  }

  // Process roads
  for (const feature of roads) {
    const geom = feature.geometry;
    if (geom.type !== 'LineString' && geom.type !== 'MultiLineString') continue;

    const lines = geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates;
    const roadClass = (feature.properties?.class as string) ?? '';
    const halfWidth = getRoadHalfWidth(roadClass, width);
    const roadRaise = 0.3; // 0.3mm raised above terrain

    for (const line of lines) {
      if (line.length < 2) continue;

      for (let i = 0; i < line.length - 1; i++) {
        const [lng0, lat0] = line[i];
        const [lng1, lat1] = line[i + 1];

        const p0 = geoToModel(lng0, lat0);
        const p1 = geoToModel(lng1, lat1);
        const z0 = sampleTerrainZ(lat0, lng0) + roadRaise;
        const z1 = sampleTerrainZ(lat1, lng1) + roadRaise;

        // Perpendicular direction
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1e-6) continue;

        const nx = (-dy / len) * halfWidth;
        const ny = (dx / len) * halfWidth;

        const v0l: Vec3 = { x: p0.x + nx, y: p0.y + ny, z: z0 };
        const v0r: Vec3 = { x: p0.x - nx, y: p0.y - ny, z: z0 };
        const v1l: Vec3 = { x: p1.x + nx, y: p1.y + ny, z: z1 };
        const v1r: Vec3 = { x: p1.x - nx, y: p1.y - ny, z: z1 };

        // Quad strip: two triangles per segment (upward-facing normals)
        triangles.push(createTriangle(v0l, v0r, v1l));
        triangles.push(createTriangle(v1l, v0r, v1r));
      }
    }
  }

  return triangles;
}

function getRoadHalfWidth(roadClass: string, modelWidth: number): number {
  // Road widths in mm, halved for offset from centerline
  // Scale relative to model size (base on 100mm model)
  const scale = modelWidth / 100;
  switch (roadClass) {
    case 'motorway':
    case 'trunk':
      return (1.5 / 2) * scale;
    case 'primary':
    case 'secondary':
      return (1.0 / 2) * scale;
    case 'tertiary':
    case 'street':
    case 'residential':
      return (0.6 / 2) * scale;
    default:
      return (0.4 / 2) * scale;
  }
}
