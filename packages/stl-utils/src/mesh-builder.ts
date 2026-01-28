import type { Vec3, Triangle } from './types';

export function subtractVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function crossProduct(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function computeNormal(v0: Vec3, v1: Vec3, v2: Vec3): Vec3 {
  const edge1 = subtractVec3(v1, v0);
  const edge2 = subtractVec3(v2, v0);
  return normalize(crossProduct(edge1, edge2));
}

export function createTriangle(v0: Vec3, v1: Vec3, v2: Vec3): Triangle {
  return {
    normal: computeNormal(v0, v1, v2),
    vertices: [v0, v1, v2],
  };
}

/**
 * Creates two triangles from a quad defined by four corners.
 * Vertices should be provided in counter-clockwise order when viewed from outside.
 *
 *  tl --- tr
 *  |  \    |
 *  |   \   |
 *  |    \  |
 *  bl --- br
 */
export function createQuad(tl: Vec3, tr: Vec3, bl: Vec3, br: Vec3): Triangle[] {
  return [
    createTriangle(tl, bl, tr),
    createTriangle(tr, bl, br),
  ];
}
