export interface SvmPoint {
  x: number;
  y: number;
  label: string;
}

export interface MarginLine {
  yLeft: number;
  yRight: number;
}

export interface MarginResult {
  slope: number;
  intercept: number;
  /** Perpendicular distance from the line to the nearest class-A point — negative if that point is misclassified. */
  marginA: number;
  /** Perpendicular distance from the line to the nearest class-B point — negative if that point is misclassified. */
  marginB: number;
  /** True only when every point sits on its correct side of the line. */
  separates: boolean;
  /** The full "street" width (marginA + marginB) when separating; 0 otherwise — there's no margin to speak of if the line misclassifies anything. */
  streetWidth: number;
}

/**
 * Signed value of the line y = slope*x + intercept at a point, positive above the line.
 * Dividing by sqrt(slope^2 + 1) converts it to a true perpendicular Euclidean distance.
 */
function signedDistance(slope: number, intercept: number, x: number, y: number): number {
  return (y - (slope * x + intercept)) / Math.sqrt(slope * slope + 1);
}

export function evaluateMargin(
  points: SvmPoint[],
  yLeft: number,
  yRight: number,
  xDomain: [number, number],
): MarginResult {
  const [xMin, xMax] = xDomain;
  const slope = (yRight - yLeft) / (xMax - xMin);
  const intercept = yLeft - slope * xMin;
  const [labelA, labelB] = [...new Set(points.map((p) => p.label))];

  const aDistances = points
    .filter((p) => p.label === labelA)
    .map((p) => signedDistance(slope, intercept, p.x, p.y));
  const bDistances = points
    .filter((p) => p.label === labelB)
    .map((p) => -signedDistance(slope, intercept, p.x, p.y));

  const marginA = Math.min(...aDistances);
  const marginB = Math.min(...bDistances);
  const separates = marginA > 0 && marginB > 0;

  return { slope, intercept, marginA, marginB, separates, streetWidth: separates ? marginA + marginB : 0 };
}

/** The two lines flanking the boundary, each just touching the nearest point of its class. */
export function marginLineEndpoints(result: MarginResult, xDomain: [number, number]): { aLine: MarginLine; bLine: MarginLine } {
  const [xMin, xMax] = xDomain;
  const norm = Math.sqrt(result.slope * result.slope + 1);
  const baseLeft = result.slope * xMin + result.intercept;
  const baseRight = result.slope * xMax + result.intercept;
  return {
    aLine: { yLeft: baseLeft + result.marginA * norm, yRight: baseRight + result.marginA * norm },
    bLine: { yLeft: baseLeft - result.marginB * norm, yRight: baseRight - result.marginB * norm },
  };
}

/** Two well-separated clusters; (3,6) and (5,4) are the closest pair across classes — the two support vectors. */
export const SVM_POINTS: SvmPoint[] = [
  { x: 3, y: 6, label: "A" },
  { x: 1, y: 7, label: "A" },
  { x: 6, y: 10, label: "A" },
  { x: 0, y: 9, label: "A" },
  { x: 5, y: 4, label: "B" },
  { x: 7, y: 2, label: "B" },
  { x: 8, y: 3, label: "B" },
  { x: 2, y: 0, label: "B" },
];

export const SVM_X_DOMAIN: [number, number] = [0, 8];
export const SVM_Y_DOMAIN: [number, number] = [0, 10];

/** The perpendicular bisector of the (3,6)-(5,4) support-vector segment: y = x + 1, i.e. yLeft=1, yRight=9. */
export const BEST_YLEFT = 1;
export const BEST_YRIGHT = 9;
export const BEST_MARGIN = evaluateMargin(SVM_POINTS, BEST_YLEFT, BEST_YRIGHT, SVM_X_DOMAIN);
