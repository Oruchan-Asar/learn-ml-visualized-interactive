import { describe, it, expect } from "vitest";
import {
  CUBE_VERTEX_COUNT,
  CUBE_TRIANGLE_COUNT,
  CUBE_SIDE_LENGTH,
  CHECKPOINT_VOXEL_RESOLUTION,
  pointCloudBytes,
  voxelGridBytes,
  meshBytes,
  voxelQuantizationError,
  summarizeRepresentations,
} from "@/lib/math-core/representing-3d-data";

describe("pointCloudBytes", () => {
  it("is n points x 3 coordinates x 4 bytes/float32", () => {
    expect(pointCloudBytes(CUBE_VERTEX_COUNT)).toBe(8 * 3 * 4);
    expect(pointCloudBytes(CUBE_VERTEX_COUNT)).toBe(96);
  });

  it("scales linearly with point count", () => {
    expect(pointCloudBytes(100)).toBe(1200);
    expect(pointCloudBytes(1)).toBe(12);
  });
});

describe("voxelGridBytes", () => {
  it("is resolution^3 x 1 byte/cell, growing cubically", () => {
    expect(voxelGridBytes(2)).toBe(8);
    expect(voxelGridBytes(8)).toBe(512);
    expect(voxelGridBytes(16)).toBe(4096);
  });

  it("doubling resolution multiplies bytes by 8, not 2", () => {
    const small = voxelGridBytes(4);
    const doubled = voxelGridBytes(8);
    expect(doubled).toBe(small * 8);
  });
});

describe("meshBytes", () => {
  it("is vertex bytes plus 3 uint32 indices per triangle", () => {
    // 8 vertices x 3 floats x 4 bytes = 96, plus 12 triangles x 3 indices x 4 bytes = 144
    expect(meshBytes(CUBE_VERTEX_COUNT, CUBE_TRIANGLE_COUNT)).toBe(96 + 144);
    expect(meshBytes(CUBE_VERTEX_COUNT, CUBE_TRIANGLE_COUNT)).toBe(240);
  });

  it("always costs more than the same points stored as a bare point cloud", () => {
    expect(meshBytes(CUBE_VERTEX_COUNT, CUBE_TRIANGLE_COUNT)).toBeGreaterThan(pointCloudBytes(CUBE_VERTEX_COUNT));
  });
});

describe("voxelQuantizationError", () => {
  it("is half a cell width, and shrinks as resolution grows", () => {
    expect(voxelQuantizationError(CUBE_SIDE_LENGTH, 2)).toBeCloseTo(0.25, 10);
    expect(voxelQuantizationError(CUBE_SIDE_LENGTH, CHECKPOINT_VOXEL_RESOLUTION)).toBeCloseTo(0.0625, 10);
    expect(voxelQuantizationError(CUBE_SIDE_LENGTH, 16)).toBeCloseTo(0.03125, 10);
  });
});

describe("summarizeRepresentations", () => {
  it("lists all three representations of the same cube, point cloud and mesh independent of voxel resolution", () => {
    const summary = summarizeRepresentations(8);
    expect(summary).toHaveLength(3);
    expect(summary[0]).toEqual({ label: "Point cloud", bytes: 96 });
    expect(summary[1]).toEqual({ label: "Voxel grid (8³)", bytes: 512 });
    expect(summary[2]).toEqual({ label: "Mesh", bytes: 240 });
  });

  it("only the voxel grid's byte count changes when resolution changes", () => {
    const low = summarizeRepresentations(4);
    const high = summarizeRepresentations(16);
    expect(low[0].bytes).toBe(high[0].bytes);
    expect(low[2].bytes).toBe(high[2].bytes);
    expect(low[1].bytes).not.toBe(high[1].bytes);
  });
});
