import { describe, it, expect } from "vitest";
import {
  spatialHash,
  isDense,
  vertexSlot,
  bilinearInterpolate,
  encodeMultiResolution,
  COARSE_LEVEL,
  FINE_LEVEL,
  QUERY_POINT,
  CHECKPOINT_TARGET_VALUE,
} from "@/lib/math-core/instant-ngp-and-hash-encoding";

describe("isDense", () => {
  it("the coarse level (2x2=4 vertices, table size 4) is exactly dense", () => {
    expect(isDense(2, 4)).toBe(true);
  });

  it("the fine level (4x4=16 vertices, table size 8) is not dense — collisions are forced", () => {
    expect(isDense(4, 8)).toBe(false);
  });
});

describe("vertexSlot — dense level indexes directly", () => {
  it("indexes the coarse level row-major, one vertex per slot", () => {
    expect(vertexSlot(0, 0, COARSE_LEVEL)).toBe(0);
    expect(vertexSlot(1, 0, COARSE_LEVEL)).toBe(1);
    expect(vertexSlot(0, 1, COARSE_LEVEL)).toBe(2);
    expect(vertexSlot(1, 1, COARSE_LEVEL)).toBe(3);
  });
});

describe("spatialHash — hand-worked collisions on the fine level's 8-slot table", () => {
  it("matches hand computation for a few vertices", () => {
    expect(spatialHash(0, 0, 8)).toBe(0);
    expect(spatialHash(1, 2, 8)).toBe(7); // 1 ^ 14 = 15, 15 mod 8 = 7
    expect(spatialHash(1, 3, 8)).toBe(4); // 1 ^ 21 = 20, 20 mod 8 = 4
  });

  it("three distinct fine-level vertices collide into the same slot (6)", () => {
    expect(spatialHash(1, 1, 8)).toBe(6);
    expect(spatialHash(0, 2, 8)).toBe(6);
    expect(spatialHash(3, 3, 8)).toBe(6);
  });
});

describe("bilinearInterpolate — hand-worked at the default query point (0.3, 0.7)", () => {
  it("coarse level: dense table [1,2,3,4] interpolates to 2.70", () => {
    const { value, corners } = bilinearInterpolate(QUERY_POINT.x, QUERY_POINT.y, COARSE_LEVEL);
    expect(value).toBeCloseTo(2.7, 10);
    const weightSum = corners.reduce((s, c) => s + c.weight, 0);
    expect(weightSum).toBeCloseTo(1, 10);
  });

  it("fine level: hashed lookups interpolate to 76.2", () => {
    const { value } = bilinearInterpolate(QUERY_POINT.x, QUERY_POINT.y, FINE_LEVEL);
    expect(value).toBeCloseTo(76.2, 10);
  });
});

describe("encodeMultiResolution", () => {
  it("concatenates both levels' interpolated features", () => {
    const encoded = encodeMultiResolution(QUERY_POINT.x, QUERY_POINT.y, [COARSE_LEVEL, FINE_LEVEL]);
    expect(encoded[0]).toBeCloseTo(2.7, 10);
    expect(encoded[1]).toBeCloseTo(76.2, 10);
  });
});

describe("checkpoint target is reachable", () => {
  it("query point (1/3, 1) lands exactly on fine-level vertex (1,3), whose feature is 50", () => {
    const { value } = bilinearInterpolate(1 / 3, 1, FINE_LEVEL);
    expect(value).toBeCloseTo(CHECKPOINT_TARGET_VALUE, 10);
  });
});
