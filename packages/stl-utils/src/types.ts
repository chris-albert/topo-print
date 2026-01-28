export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Triangle {
  normal: Vec3;
  vertices: [Vec3, Vec3, Vec3];
}

export interface ElevationGrid {
  /** 2D array of elevation values in meters. grid[row][col] */
  data: number[][];
  /** Number of rows (latitude steps) */
  rows: number;
  /** Number of columns (longitude steps) */
  cols: number;
}

export interface TerrainMeshOptions {
  /** Width of the output model in mm (default: 100) */
  width?: number;
  /** Depth of the output model in mm (default: 100) */
  depth?: number;
  /** Vertical exaggeration factor (default: 1.5) */
  verticalScale?: number;
  /** Base thickness in mm below the lowest elevation point (default: 2) */
  baseHeight?: number;
}
