/** Solves Ax = b via Gaussian elimination with partial pivoting. A is square. */
export function solveLinearSystem(a: number[][], b: number[]): number[] {
  const n = a.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

/** Least-squares polynomial coefficients [c0, c1, ..., cDegree] (so f(x) = c0 + c1*x + ... ), via the normal equations. */
export function polyFit(xs: number[], ys: number[], degree: number): number[] {
  const p = degree + 1;
  const xtx = Array.from({ length: p }, () => new Array(p).fill(0));
  const xty = new Array(p).fill(0);
  for (let i = 0; i < xs.length; i++) {
    const powers: number[] = [];
    let acc = 1;
    for (let k = 0; k < p; k++) {
      powers.push(acc);
      acc *= xs[i];
    }
    for (let r = 0; r < p; r++) {
      xty[r] += powers[r] * ys[i];
      for (let c = 0; c < p; c++) xtx[r][c] += powers[r] * powers[c];
    }
  }
  return solveLinearSystem(xtx, xty);
}

export function evalPoly(coeffs: number[], x: number): number {
  let acc = 0;
  let xp = 1;
  for (const c of coeffs) {
    acc += c * xp;
    xp *= x;
  }
  return acc;
}

export function sampleCurve(coeffs: number[], domain: [number, number], samples = 60): { x: number; y: number }[] {
  const [xMin, xMax] = domain;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = xMin + ((xMax - xMin) * i) / samples;
    pts.push({ x, y: evalPoly(coeffs, x) });
  }
  return pts;
}

/** The true function: has both a quadratic term (curvature no line can capture) and a linear term. */
export function trueFunction(x: number): number {
  return x * x + 0.5 * x;
}

export const X_POINTS = [-2, -1, 0, 1, 2];
export const CURVE_DOMAIN: [number, number] = [-2, 2];
export const RANGE_DOMAIN: [number, number] = [-2, 6];
export const MAX_DEGREE = 4;

/** Six fixed noise realizations, each mean-zero across datasets at every x — so a perfectly flexible model's average prediction has zero bias by construction. */
export const NOISE_SETS: number[][] = [
  [0.6, -0.4, 0.3, -0.5, 0.4],
  [-0.5, 0.5, -0.2, 0.4, -0.3],
  [0.4, -0.3, 0.1, 0.3, -0.5],
  [-0.3, 0.4, -0.4, -0.3, 0.5],
  [0.5, -0.6, 0.3, 0.5, -0.4],
  [-0.7, 0.4, -0.1, -0.4, 0.3],
];

export function noisyYs(datasetIndex: number): number[] {
  const noise = NOISE_SETS[datasetIndex];
  return X_POINTS.map((x, i) => trueFunction(x) + noise[i]);
}

/** Fits the given degree to every one of the 6 noisy datasets. */
export function fitAllDatasets(degree: number): number[][] {
  return NOISE_SETS.map((_, k) => polyFit(X_POINTS, noisyYs(k), degree));
}

export interface BiasVarianceResult {
  biasSquared: number;
  variance: number;
  total: number;
}

/** Averaged over the 5 x points: bias² of the mean prediction, and variance of the predictions, across the 6 fits. */
export function biasVarianceAtDegree(degree: number): BiasVarianceResult {
  const fits = fitAllDatasets(degree);
  let totalBias2 = 0;
  let totalVariance = 0;
  for (const x of X_POINTS) {
    const predictions = fits.map((coeffs) => evalPoly(coeffs, x));
    const meanPrediction = predictions.reduce((s, v) => s + v, 0) / predictions.length;
    totalBias2 += (meanPrediction - trueFunction(x)) ** 2;
    totalVariance += predictions.reduce((s, v) => s + (v - meanPrediction) ** 2, 0) / predictions.length;
  }
  const biasSquared = totalBias2 / X_POINTS.length;
  const variance = totalVariance / X_POINTS.length;
  return { biasSquared, variance, total: biasSquared + variance };
}
