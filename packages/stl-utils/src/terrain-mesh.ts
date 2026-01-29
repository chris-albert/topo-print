import type { Vec3, Triangle, ElevationGrid, TerrainMeshOptions } from './types';
import { createTriangle, createQuad } from './mesh-builder';

const DEFAULT_OPTIONS: Required<TerrainMeshOptions> = {
  width: 100,
  depth: 100,
  verticalScale: 1.5,
  baseHeight: 2,
};

export function buildTerrainMesh(
  grid: ElevationGrid,
  options?: TerrainMeshOptions
): Triangle[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { rows, cols, data } = grid;

  if (rows < 2 || cols < 2) {
    throw new Error('Grid must have at least 2 rows and 2 columns');
  }

  // Find min/max elevation
  let minElev = Infinity;
  let maxElev = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const e = data[r][c];
      if (e < minElev) minElev = e;
      if (e > maxElev) maxElev = e;
    }
  }

  const elevRange = maxElev - minElev;
  // Scale elevation to a reasonable height relative to the model width
  const maxTerrainHeight = elevRange === 0 ? 0 : (opts.width * 0.3) * opts.verticalScale;

  // Helper to map grid position to 3D coordinates
  function getVertex(row: number, col: number): Vec3 {
    const x = (col / (cols - 1)) * opts.width;
    const y = ((rows - 1 - row) / (rows - 1)) * opts.depth; // flip so row 0 = north = max Y
    const rawElev = data[row][col];
    const normalizedElev = elevRange === 0 ? 0 : (rawElev - minElev) / elevRange;
    const z = opts.baseHeight + normalizedElev * maxTerrainHeight;
    return { x, y, z };
  }

  const triangles: Triangle[] = [];

  // --- Top surface ---
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const tl = getVertex(r, c);
      const tr = getVertex(r, c + 1);
      const bl = getVertex(r + 1, c);
      const br = getVertex(r + 1, c + 1);
      triangles.push(...createQuad(tl, tr, bl, br));
    }
  }

  // --- Bottom face (grid at z=0, same resolution so perimeter vertices match walls) ---
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const x0 = (c / (cols - 1)) * opts.width;
      const x1 = ((c + 1) / (cols - 1)) * opts.width;
      const y0 = ((rows - 1 - (r + 1)) / (rows - 1)) * opts.depth;
      const y1 = ((rows - 1 - r) / (rows - 1)) * opts.depth;

      const tl: Vec3 = { x: x0, y: y1, z: 0 };
      const tr: Vec3 = { x: x1, y: y1, z: 0 };
      const bl: Vec3 = { x: x0, y: y0, z: 0 };
      const br: Vec3 = { x: x1, y: y0, z: 0 };

      // Winding order gives downward-facing normal (-Z)
      triangles.push(createTriangle(tl, tr, bl));
      triangles.push(createTriangle(tr, br, bl));
    }
  }

  // --- Front wall (row = rows-1, y = 0) ---
  for (let c = 0; c < cols - 1; c++) {
    const topLeft = getVertex(rows - 1, c);
    const topRight = getVertex(rows - 1, c + 1);
    const bottomLeft: Vec3 = { x: topLeft.x, y: 0, z: 0 };
    const bottomRight: Vec3 = { x: topRight.x, y: 0, z: 0 };
    triangles.push(createTriangle(topLeft, bottomLeft, topRight));
    triangles.push(createTriangle(topRight, bottomLeft, bottomRight));
  }

  // --- Back wall (row = 0, y = depth) ---
  for (let c = 0; c < cols - 1; c++) {
    const topLeft = getVertex(0, c);
    const topRight = getVertex(0, c + 1);
    const bottomLeft: Vec3 = { x: topLeft.x, y: opts.depth, z: 0 };
    const bottomRight: Vec3 = { x: topRight.x, y: opts.depth, z: 0 };
    triangles.push(createTriangle(topRight, bottomRight, topLeft));
    triangles.push(createTriangle(topLeft, bottomRight, bottomLeft));
  }

  // --- Left wall (col = 0, x = 0) ---
  for (let r = 0; r < rows - 1; r++) {
    const topBottom = getVertex(r + 1, 0); // lower Y
    const topTop = getVertex(r, 0);       // higher Y
    const bottomBottom: Vec3 = { x: 0, y: topBottom.y, z: 0 };
    const bottomTop: Vec3 = { x: 0, y: topTop.y, z: 0 };
    triangles.push(createTriangle(topTop, bottomTop, topBottom));
    triangles.push(createTriangle(topBottom, bottomTop, bottomBottom));
  }

  // --- Right wall (col = cols-1, x = width) ---
  for (let r = 0; r < rows - 1; r++) {
    const topBottom = getVertex(r + 1, cols - 1);
    const topTop = getVertex(r, cols - 1);
    const bottomBottom: Vec3 = { x: opts.width, y: topBottom.y, z: 0 };
    const bottomTop: Vec3 = { x: opts.width, y: topTop.y, z: 0 };
    triangles.push(createTriangle(topBottom, bottomBottom, topTop));
    triangles.push(createTriangle(topTop, bottomBottom, bottomTop));
  }

  return triangles;
}
