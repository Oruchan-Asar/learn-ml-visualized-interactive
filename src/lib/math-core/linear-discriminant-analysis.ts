export interface Point2D {
  x: number;
  y: number;
}

/**
 * Two classes, two points each, engineered so the within-class scatter matrix is a clean multiple of
 * the identity: class A spreads only along x, class B spreads only along y, so their scatter contributions
 * add up to a diagonal (hence trivially invertible) matrix — every step below is exact hand arithmetic.
 */
export const CLASS_A: Point2D[] = [
  { x: 1, y: 2 },
  { x: 3, y: 2 },
];
export const CLASS_B: Point2D[] = [
  { x: 6, y: 3 },
  { x: 6, y: 5 },
];

export function mean(points: Point2D[]): Point2D {
  const n = points.length;
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n,
  };
}

export type Matrix2 = [[number, number], [number, number]];

function outer(dx: number, dy: number): Matrix2 {
  return [
    [dx * dx, dx * dy],
    [dx * dy, dy * dy],
  ];
}

function addMatrix(a: Matrix2, b: Matrix2): Matrix2 {
  return [
    [a[0][0] + b[0][0], a[0][1] + b[0][1]],
    [a[1][0] + b[1][0], a[1][1] + b[1][1]],
  ];
}

/** Within-class scatter for one class: sum of outer((point - mean), (point - mean)) over its points. */
export function withinClassScatter(points: Point2D[]): Matrix2 {
  const m = mean(points);
  return points.reduce<Matrix2>(
    (acc, p) => addMatrix(acc, outer(p.x - m.x, p.y - m.y)),
    [
      [0, 0],
      [0, 0],
    ],
  );
}

/** Total within-class scatter S_W: the sum of every class's own within-class scatter. Small = tight clusters. */
export function totalWithinClassScatter(classes: Point2D[][]): Matrix2 {
  return classes.reduce<Matrix2>(
    (acc, cls) => addMatrix(acc, withinClassScatter(cls)),
    [
      [0, 0],
      [0, 0],
    ],
  );
}

/** Between-class scatter for the two-class case: the outer product of the mean difference vector. Large = far-apart clusters. */
export function betweenClassScatter(meanA: Point2D, meanB: Point2D): Matrix2 {
  return outer(meanA.x - meanB.x, meanA.y - meanB.y);
}

function invert2x2(m: Matrix2): Matrix2 {
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  return [
    [m[1][1] / det, -m[0][1] / det],
    [-m[1][0] / det, m[0][0] / det],
  ];
}

function matVec(m: Matrix2, v: Point2D): Point2D {
  return { x: m[0][0] * v.x + m[0][1] * v.y, y: m[1][0] * v.x + m[1][1] * v.y };
}

/** Fisher's LDA direction for two classes: S_W⁻¹(mean_A − mean_B). Points this way maximize the ratio
 *  of between-class separation to within-class spread once projected onto it. */
export function ldaDirection(classA: Point2D[], classB: Point2D[]): Point2D {
  const meanA = mean(classA);
  const meanB = mean(classB);
  const sw = totalWithinClassScatter([classA, classB]);
  const swInv = invert2x2(sw);
  return matVec(swInv, { x: meanA.x - meanB.x, y: meanA.y - meanB.y });
}

/** Scalar projection of a point onto a (not-necessarily-unit) direction. */
export function project(point: Point2D, direction: Point2D): number {
  const norm = Math.hypot(direction.x, direction.y);
  if (norm === 0) return 0;
  return (point.x * direction.x + point.y * direction.y) / norm;
}

export const DOMAIN: [number, number] = [0, 8];
