/**
 * The same small shape — a unit cube, 8 corner vertices — can be stored as a point cloud, a voxel grid,
 * or a triangle mesh. Each representation trades memory for different things: a point cloud is exact but
 * has no notion of "inside" or "surface"; a voxel grid gets connectivity and occupancy for free but only
 * at the cost of quantizing space into cells; a mesh is exact *and* has explicit surface connectivity, at
 * the cost of also storing that connectivity (the triangle list) on top of the vertices.
 */

export const CUBE_VERTEX_COUNT = 8;
export const CUBE_TRIANGLE_COUNT = 12; // 2 triangles per face x 6 faces, closed surface
export const CUBE_SIDE_LENGTH = 1; // arbitrary units

const BYTES_PER_FLOAT = 4; // float32
const BYTES_PER_INDEX = 4; // uint32
const BYTES_PER_VOXEL = 1; // one occupancy byte per cell

/** n points, each 3 float32 coordinates. */
export function pointCloudBytes(n: number, bytesPerFloat: number = BYTES_PER_FLOAT): number {
  return n * 3 * bytesPerFloat;
}

/** A resolution^3 occupancy grid, one byte per cell — exact positions are gone, only occupied/empty remains. */
export function voxelGridBytes(resolution: number, bytesPerVoxel: number = BYTES_PER_VOXEL): number {
  return resolution ** 3 * bytesPerVoxel;
}

/** Vertices (float32 coordinates) plus a triangle list (three uint32 vertex indices per triangle). */
export function meshBytes(
  vertexCount: number,
  triangleCount: number,
  bytesPerFloat: number = BYTES_PER_FLOAT,
  bytesPerIndex: number = BYTES_PER_INDEX,
): number {
  return pointCloudBytes(vertexCount, bytesPerFloat) + triangleCount * 3 * bytesPerIndex;
}

/** The largest positional error a voxel grid can introduce: half a cell's width, since a vertex snaps
 * to whichever cell center it falls in. A point cloud or mesh, storing exact coordinates, has zero error. */
export function voxelQuantizationError(sideLength: number, resolution: number): number {
  return sideLength / resolution / 2;
}

export interface RepresentationSummary {
  label: string;
  bytes: number;
}

/** All three representations of the same cube, at a given voxel resolution — used to compare them side by side. */
export function summarizeRepresentations(voxelResolution: number): RepresentationSummary[] {
  return [
    { label: "Point cloud", bytes: pointCloudBytes(CUBE_VERTEX_COUNT) },
    { label: `Voxel grid (${voxelResolution}³)`, bytes: voxelGridBytes(voxelResolution) },
    { label: "Mesh", bytes: meshBytes(CUBE_VERTEX_COUNT, CUBE_TRIANGLE_COUNT) },
  ];
}

export const CHECKPOINT_VOXEL_RESOLUTION = 8;
