import { describe, it, expect } from "vitest";
import {
  SVM_POINTS,
  SVM_X_DOMAIN,
  BEST_YLEFT,
  BEST_YRIGHT,
  BEST_MARGIN,
  evaluateMargin,
  marginLineEndpoints,
} from "@/lib/math-core/svm";

describe("evaluateMargin at the true best line (y = x + 1)", () => {
  it("separates both classes", () => {
    expect(BEST_MARGIN.separates).toBe(true);
  });

  it("both margins equal sqrt(2) — the perpendicular bisector is equidistant from its two support vectors", () => {
    expect(BEST_MARGIN.marginA).toBeCloseTo(Math.sqrt(2), 10);
    expect(BEST_MARGIN.marginB).toBeCloseTo(Math.sqrt(2), 10);
  });

  it("street width equals the Euclidean distance between the two support vectors, 2*sqrt(2)", () => {
    const supportVectorDistance = Math.hypot(5 - 3, 4 - 6);
    expect(BEST_MARGIN.streetWidth).toBeCloseTo(supportVectorDistance, 10);
    expect(BEST_MARGIN.streetWidth).toBeCloseTo(2 * Math.sqrt(2), 10);
  });
});

describe("marginLineEndpoints touch the actual support vectors", () => {
  it("the class-A margin line passes exactly through (3,6)", () => {
    const { aLine } = marginLineEndpoints(BEST_MARGIN, SVM_X_DOMAIN);
    const slopeOfMarginLine = (aLine.yRight - aLine.yLeft) / (SVM_X_DOMAIN[1] - SVM_X_DOMAIN[0]);
    const yAt3 = aLine.yLeft + slopeOfMarginLine * (3 - SVM_X_DOMAIN[0]);
    expect(yAt3).toBeCloseTo(6, 8);
  });

  it("the class-B margin line passes exactly through (5,4)", () => {
    const { bLine } = marginLineEndpoints(BEST_MARGIN, SVM_X_DOMAIN);
    const slopeOfMarginLine = (bLine.yRight - bLine.yLeft) / (SVM_X_DOMAIN[1] - SVM_X_DOMAIN[0]);
    const yAt5 = bLine.yLeft + slopeOfMarginLine * (5 - SVM_X_DOMAIN[0]);
    expect(yAt5).toBeCloseTo(4, 8);
  });
});

describe("evaluateMargin correctly detects non-separating lines", () => {
  it("a horizontal line at y=8 cuts through class A (which has points at y=6 and y=7) and has zero street width", () => {
    const result = evaluateMargin(SVM_POINTS, 8, 8, SVM_X_DOMAIN);
    expect(result.separates).toBe(false);
    expect(result.streetWidth).toBe(0);
  });
});

describe("(yLeft=1, yRight=9) is the true global optimum, confirmed by grid search", () => {
  it("no other candidate line in a fine grid beats its street width", () => {
    let best = -Infinity;
    for (let yl = 0; yl <= 10; yl += 0.1) {
      for (let yr = 0; yr <= 10; yr += 0.1) {
        const result = evaluateMargin(SVM_POINTS, yl, yr, SVM_X_DOMAIN);
        if (result.streetWidth > best) best = result.streetWidth;
      }
    }
    expect(best).toBeCloseTo(BEST_MARGIN.streetWidth, 1);
  });

  it("BEST_YLEFT/BEST_YRIGHT reproduce BEST_MARGIN exactly", () => {
    const result = evaluateMargin(SVM_POINTS, BEST_YLEFT, BEST_YRIGHT, SVM_X_DOMAIN);
    expect(result.streetWidth).toBeCloseTo(BEST_MARGIN.streetWidth, 10);
  });
});
