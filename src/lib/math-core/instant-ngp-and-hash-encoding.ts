/**
 * A NeRF MLP is slow mostly because it has to be big to memorize fine detail. Instant-NGP's fix: store
 * the fine detail in a lookup table instead, and let the MLP stay tiny. Several grids, from coarse to
 * fine, each cover the same space; each grid vertex owns a learned feature vector (here, one scalar for
 * simplicity). Querying a point bilinearly interpolates the 4 surrounding vertices' features at each
 * resolution, then concatenates every level's result into one encoding.
 *
 * A resolution-R grid has R^2 vertices, which grows fast. Instead of storing every vertex directly, each
 * level owns a *fixed-size* hash table: a vertex's feature lives at slot `spatialHash(ix, iy) mod T`. When
 * R^2 <= T there's a slot for every vertex, so indexing is direct (dense) and collision-free. Once R^2 > T,
 * two different vertices can land in the same slot — a collision. Instant-NGP just accepts this: enough
 * *other* vertices land in their own slots that gradient descent still learns a useful feature per
 * location, and the memory footprint stays capped at T regardless of how fine the grid gets.
 */

export interface GridLevel {
  resolution: number; // vertices per axis
  tableSize: number; // fixed hash table size T
  table: number[]; // length tableSize, one learned feature per slot
}

// Toy hash primes (real Instant-NGP uses 1 and 2654435761) — small enough to XOR and mod by hand.
export const PRIME_X = 1;
export const PRIME_Y = 7;

/** Instant-NGP's spatial hash: XOR each axis's coordinate (scaled by a prime), then wrap into the table. */
export function spatialHash(ix: number, iy: number, tableSize: number): number {
  const h = (ix * PRIME_X) ^ (iy * PRIME_Y);
  return ((h % tableSize) + tableSize) % tableSize;
}

/** A grid is dense (collision-free) exactly when it has no more vertices than table slots. */
export function isDense(resolution: number, tableSize: number): boolean {
  return resolution * resolution <= tableSize;
}

/** Which table slot a grid vertex's feature lives in — direct index if dense, else the spatial hash. */
export function vertexSlot(ix: number, iy: number, level: GridLevel): number {
  if (isDense(level.resolution, level.tableSize)) return iy * level.resolution + ix;
  return spatialHash(ix, iy, level.tableSize);
}

export function lookupFeature(ix: number, iy: number, level: GridLevel): number {
  return level.table[vertexSlot(ix, iy, level)];
}

export interface BilinearCorner {
  ix: number;
  iy: number;
  weight: number;
  value: number;
}

export interface BilinearResult {
  corners: BilinearCorner[];
  value: number;
}

/** Bilinearly interpolate one level's feature at a query point (qx, qy) in [0, 1]^2. */
export function bilinearInterpolate(qx: number, qy: number, level: GridLevel): BilinearResult {
  const scale = level.resolution - 1;
  const sx = qx * scale;
  const sy = qy * scale;
  const ix0 = Math.min(Math.floor(sx), level.resolution - 1);
  const iy0 = Math.min(Math.floor(sy), level.resolution - 1);
  const fx = sx - ix0;
  const fy = sy - iy0;
  const ix1 = Math.min(ix0 + 1, level.resolution - 1);
  const iy1 = Math.min(iy0 + 1, level.resolution - 1);

  const corners: BilinearCorner[] = [
    { ix: ix0, iy: iy0, weight: (1 - fx) * (1 - fy), value: lookupFeature(ix0, iy0, level) },
    { ix: ix1, iy: iy0, weight: fx * (1 - fy), value: lookupFeature(ix1, iy0, level) },
    { ix: ix0, iy: iy1, weight: (1 - fx) * fy, value: lookupFeature(ix0, iy1, level) },
    { ix: ix1, iy: iy1, weight: fx * fy, value: lookupFeature(ix1, iy1, level) },
  ];
  const value = corners.reduce((sum, c) => sum + c.weight * c.value, 0);
  return { corners, value };
}

/** The full Instant-NGP encoding: every level's interpolated feature, concatenated. */
export function encodeMultiResolution(qx: number, qy: number, levels: GridLevel[]): number[] {
  return levels.map((level) => bilinearInterpolate(qx, qy, level).value);
}

// Coarse level: 2x2 vertices, table size 4 — exactly enough slots, so indexing is dense.
export const COARSE_LEVEL: GridLevel = { resolution: 2, tableSize: 4, table: [1, 2, 3, 4] };

// Fine level: 4x4 = 16 vertices crammed into only 8 slots — collisions are unavoidable.
export const FINE_LEVEL: GridLevel = { resolution: 4, tableSize: 8, table: [10, 20, 30, 40, 50, 60, 70, 80] };

export const LEVELS: GridLevel[] = [COARSE_LEVEL, FINE_LEVEL];

export const QUERY_POINT = { x: 0.3, y: 0.7 };

// Checkpoint: drag the query point until the fine level lands exactly on vertex (ix=1, iy=3), whose
// feature is 50 — that vertex sits at normalized position (1/3, 1).
export const CHECKPOINT_TARGET_VALUE = 50;
export const CHECKPOINT_TOLERANCE = 3;
