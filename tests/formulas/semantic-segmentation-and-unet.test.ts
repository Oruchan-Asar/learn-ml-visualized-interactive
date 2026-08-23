import { describe, it, expect } from "vitest";
import {
  INPUT,
  upsample2x,
  SKIP1,
  BOTTLENECK,
  decodeWithoutSkip,
  decodeWithSkip,
  reconstructionErrorWithoutSkip,
  reconstructionErrorWithSkip,
  mse,
} from "@/lib/math-core/semantic-segmentation-and-unet";

describe("semantic-segmentation-and-unet", () => {
  it("2x2 max pooling collapses the 4x4 input down to the exact block maxima", () => {
    expect(SKIP1).toEqual([
      [4, 8],
      [7, 9],
    ]);
    expect(BOTTLENECK).toEqual([[9]]);
  });

  it("nearest-neighbor upsampling just repeats each cell into a 2x2 block", () => {
    expect(upsample2x([[9]])).toEqual([
      [9, 9],
      [9, 9],
    ]);
    expect(upsample2x(SKIP1)).toEqual([
      [4, 4, 8, 8],
      [4, 4, 8, 8],
      [7, 7, 9, 9],
      [7, 7, 9, 9],
    ]);
  });

  it("without skip connections, the decoder can only reconstruct a uniform blur of the global max", () => {
    const decoded = decodeWithoutSkip();
    expect(decoded.flat().every((v) => v === 9)).toBe(true);
    expect(reconstructionErrorWithoutSkip()).toBeCloseTo(31.75, 10);
  });

  it("with skip connections, the decoder recovers most of the discarded spatial detail", () => {
    const decoded = decodeWithSkip();
    expect(decoded[0][0]).toBeCloseTo(3.75, 10);
    expect(decoded[3][2]).toBeCloseTo(5.5, 10);
    expect(reconstructionErrorWithSkip()).toBeCloseTo(5.421875, 10);
  });

  it("skip connections cut reconstruction error by close to 6x on this scene", () => {
    const ratio = reconstructionErrorWithoutSkip() / reconstructionErrorWithSkip();
    expect(ratio).toBeGreaterThan(5);
    expect(mse(INPUT, INPUT)).toBe(0);
  });
});
