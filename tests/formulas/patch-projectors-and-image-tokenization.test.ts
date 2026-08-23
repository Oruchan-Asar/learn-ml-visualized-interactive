import { describe, expect, it } from "vitest";
import {
  IMAGE,
  PATCHES,
  PATCH_LABELS,
  PROJECTION,
  TEXT_TOKENS,
  patchIndexOfCell,
  projectPatch,
  patchEmbedding,
  distance,
  nearestTextToken,
} from "@/lib/math-core/patch-projectors-and-image-tokenization";

describe("patchify: slicing the 4x4 image into four 2x2 patches", () => {
  it("produces four patches in row-major order", () => {
    expect(PATCHES).toHaveLength(4);
    expect(PATCHES.map((p) => p.index)).toEqual([0, 1, 2, 3]);
  });

  it("flattens each patch's 2x2 block row-major into consecutive integers", () => {
    expect(PATCHES[0].flat).toEqual([1, 2, 3, 4]);
    expect(PATCHES[1].flat).toEqual([5, 6, 7, 8]);
    expect(PATCHES[2].flat).toEqual([9, 10, 11, 12]);
    expect(PATCHES[3].flat).toEqual([13, 14, 15, 16]);
  });

  it("matches the raw pixels pulled straight out of the source image", () => {
    expect(PATCHES[3].pixels).toEqual([
      [IMAGE[2][2], IMAGE[2][3]],
      [IMAGE[3][2], IMAGE[3][3]],
    ]);
  });
});

describe("patchIndexOfCell: mapping a raw pixel cell to its patch", () => {
  it("maps every corner of the image to the expected patch, matching PATCH_LABELS", () => {
    expect(patchIndexOfCell(0, 0)).toBe(0);
    expect(patchIndexOfCell(0, 3)).toBe(1);
    expect(patchIndexOfCell(3, 0)).toBe(2);
    expect(patchIndexOfCell(3, 3)).toBe(3);
    expect(PATCH_LABELS[patchIndexOfCell(3, 3)]).toBe("bottom-right");
  });

  it("maps every cell within a 2x2 block to the same patch index", () => {
    expect(patchIndexOfCell(0, 0)).toBe(patchIndexOfCell(1, 1));
    expect(patchIndexOfCell(2, 2)).toBe(patchIndexOfCell(3, 3));
  });
});

describe("projectPatch: the linear projector W @ flat", () => {
  it("sums the top row into dim 0 and the bottom row into dim 1, for patch 0", () => {
    expect(projectPatch(PATCHES[0].flat, PROJECTION)).toEqual([3, 7]);
  });

  it("produces the expected embedding for all four patches", () => {
    expect(patchEmbedding(0)).toEqual([3, 7]);
    expect(patchEmbedding(1)).toEqual([11, 15]);
    expect(patchEmbedding(2)).toEqual([19, 23]);
    expect(patchEmbedding(3)).toEqual([27, 31]);
  });
});

describe("shared embedding space: patch embeddings vs. hand-placed text token embeddings", () => {
  it("every patch embedding lands exactly on one text token's embedding", () => {
    expect(distance(patchEmbedding(0), TEXT_TOKENS[0].vec)).toBe(0);
    expect(distance(patchEmbedding(2), TEXT_TOKENS[2].vec)).toBe(0);
  });

  it("nearestTextToken finds the exact match for each patch, with zero distance", () => {
    const { token, d } = nearestTextToken(patchEmbedding(3));
    expect(token.label).toBe("dog");
    expect(d).toBeCloseTo(0, 10);
  });

  it("a slightly perturbed embedding still finds the same nearest neighbor as its true patch", () => {
    const { token } = nearestTextToken([11.4, 14.6]); // close to patch 1's (11, 15), i.e. "grass"
    expect(token.label).toBe("grass");
  });
});
