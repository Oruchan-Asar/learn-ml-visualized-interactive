import { describe, expect, it } from "vitest";
import {
  BASE_LOGITS,
  BASE_PREDICTED_INDEX,
  computeSaliencyMap,
  maxSaliencyLocation,
  saliencyAt,
} from "@/lib/math-core/saliency-maps";

describe("the base pipeline matches the minimal CNN's own worked example", () => {
  it("predicts 'Edge detected' with logits (4, -4)", () => {
    expect(BASE_LOGITS[0]).toBeCloseTo(4, 6);
    expect(BASE_LOGITS[1]).toBeCloseTo(-4, 6);
    expect(BASE_PREDICTED_INDEX).toBe(0);
  });
});

describe("saliency map structure", () => {
  const map = computeSaliencyMap();

  it("every pixel in the left light block (columns 0-1) has exactly zero saliency", () => {
    for (let r = 0; r < 6; r++) {
      expect(map[r][0]).toBeCloseTo(0, 6);
      expect(map[r][1]).toBeCloseTo(0, 6);
    }
  });

  it("the two middle rows (2, 3) are twice as salient as the four outer rows, in the edge region", () => {
    for (let c = 2; c < 6; c++) {
      expect(map[2][c]).toBeCloseTo(1.0, 3);
      expect(map[3][c]).toBeCloseTo(1.0, 3);
      expect(map[0][c]).toBeCloseTo(0.5, 3);
      expect(map[1][c]).toBeCloseTo(0.5, 3);
      expect(map[4][c]).toBeCloseTo(0.5, 3);
      expect(map[5][c]).toBeCloseTo(0.5, 3);
    }
  });

  it("the highest-saliency pixels are all in rows 2-3, columns 2-5", () => {
    const best = maxSaliencyLocation(map);
    expect(best.value).toBeCloseTo(1.0, 3);
    expect([2, 3]).toContain(best.row);
    expect(best.col).toBeGreaterThanOrEqual(2);
  });

  it("saliencyAt agrees with the full map at a specific pixel", () => {
    expect(saliencyAt(2, 3)).toBeCloseTo(map[2][3], 6);
  });
});

describe("both output neurons read the same evidence", () => {
  it("the 'No edge' neuron's saliency map is identical to 'Edge detected''s, since its weights are the exact negation", () => {
    const mapEdge = computeSaliencyMap(0);
    const mapNoEdge = computeSaliencyMap(1);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        expect(mapNoEdge[r][c]).toBeCloseTo(mapEdge[r][c], 6);
      }
    }
  });
});
