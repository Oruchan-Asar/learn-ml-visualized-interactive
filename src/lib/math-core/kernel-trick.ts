export interface KernelPoint {
  x: number;
  y: number;
  label: string;
}

function polar(r: number, degrees: number): { x: number; y: number } {
  const rad = (degrees * Math.PI) / 180;
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
}

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
/** Alternating radii (not a perfect circle) so points don't all land on exactly one spot once lifted. */
const INNER_RADII = [1.8, 2.2, 1.8, 2.2, 1.8, 2.2, 1.8, 2.2];
const OUTER_RADII = [4.7, 5.3, 4.7, 5.3, 4.7, 5.3, 4.7, 5.3];

function ring(radii: number[], label: string): KernelPoint[] {
  return ANGLES.map((angle, i) => {
    const { x, y } = polar(radii[i], angle);
    return { x: Math.round(x * 1e6) / 1e6, y: Math.round(y * 1e6) / 1e6, label };
  });
}

/** An inner ring (class A) fully surrounded by an outer ring (class B) — no straight line can separate them. */
export const KERNEL_POINTS: KernelPoint[] = [...ring(INNER_RADII, "A"), ...ring(OUTER_RADII, "B")];

export const KERNEL_DOMAIN: [number, number] = [-6, 6];

/** The kernel feature: squared radius. Identical points' angle doesn't matter — only distance from the origin does. */
export function liftedFeature(p: KernelPoint): number {
  return p.x * p.x + p.y * p.y;
}

export interface LiftedPoint {
  x: number;
  label: string;
}

export const LIFTED_POINTS: LiftedPoint[] = KERNEL_POINTS.map((p) => ({ x: liftedFeature(p), label: p.label }));
export const LIFTED_DOMAIN: [number, number] = [0, 30];

function lineValue(x: number, y: number, slope: number, intercept: number): number {
  return y - (slope * x + intercept);
}

/** Accuracy of the line y = slope*x + intercept (parameterized by its y-value at each domain edge) at separating the classes. */
export function classificationAccuracy(
  points: KernelPoint[],
  yLeft: number,
  yRight: number,
  xDomain: [number, number],
): number {
  const [xMin, xMax] = xDomain;
  const slope = (yRight - yLeft) / (xMax - xMin);
  const intercept = yLeft - slope * xMin;
  const [labelA, labelB] = [...new Set(points.map((p) => p.label))];
  const correct = points.filter((p) => {
    const above = lineValue(p.x, p.y, slope, intercept) >= 0;
    return above ? p.label === labelA : p.label === labelB;
  }).length;
  return correct / points.length;
}

/** Accuracy of a single threshold on the lifted (1D) feature — "A" (small radius) predicted left, "B" (large radius) right. */
export function liftedAccuracy(points: LiftedPoint[], threshold: number): number {
  const correct = points.filter((p) => (p.x < threshold ? p.label === "A" : p.label === "B")).length;
  return correct / points.length;
}
