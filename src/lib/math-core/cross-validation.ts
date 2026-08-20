import { fitTrend, predictTrend, type TrendFit } from "./time-series-forecasting";

/**
 * Ten points that trend almost perfectly along y = 2x + 1 — except one, x=6, which sits
 * far off that line. A single train/test split can easily miss it entirely (giving a falsely
 * rosy error) or land it in the test set alone (giving a falsely alarming one).
 */
export const XS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const YS: number[] = XS.map((x) => 2 * x + 1);
YS[5] = 30; // x=6 would be 13 on the line; this point is the anomaly.

export const K = 5;

/** Split indices into k contiguous folds (here: 5 folds of 2 points each). */
export function foldIndices(n: number = XS.length, k: number = K): number[][] {
  const foldSize = n / k;
  return Array.from({ length: k }, (_, i) =>
    Array.from({ length: foldSize }, (_, j) => i * foldSize + j),
  );
}

export interface FoldResult {
  testIndices: number[];
  fit: TrendFit;
  mse: number;
}

/** Train on every fold but one, test on the held-out fold; repeat for each fold. */
export function runKFoldCV(xs: number[] = XS, ys: number[] = YS, k: number = K): FoldResult[] {
  const folds = foldIndices(xs.length, k);
  return folds.map((testIndices) => {
    const testSet = new Set(testIndices);
    const trainXs = xs.filter((_, i) => !testSet.has(i));
    const trainYs = ys.filter((_, i) => !testSet.has(i));
    const fit = fitTrend(trainXs, trainYs);
    const sse = testIndices.reduce((sum, i) => {
      const residual = ys[i] - predictTrend(fit, xs[i]);
      return sum + residual * residual;
    }, 0);
    return { testIndices, fit, mse: sse / testIndices.length };
  });
}

export function meanMSE(results: FoldResult[]): number {
  return results.reduce((sum, r) => sum + r.mse, 0) / results.length;
}

/** Sample standard deviation across fold MSEs — how much the "best" estimate would have varied. */
export function stdevMSE(results: FoldResult[]): number {
  const mean = meanMSE(results);
  const variance = results.reduce((sum, r) => sum + (r.mse - mean) ** 2, 0) / (results.length - 1);
  return Math.sqrt(variance);
}

/** A single arbitrary 80/20 split: train on the first 8 points, test on the last 2. */
export function singleSplitMSE(xs: number[] = XS, ys: number[] = YS, testCount = 2): number {
  const splitAt = xs.length - testCount;
  const fit = fitTrend(xs.slice(0, splitAt), ys.slice(0, splitAt));
  const sse = xs.slice(splitAt).reduce((sum, x, j) => {
    const residual = ys[splitAt + j] - predictTrend(fit, x);
    return sum + residual * residual;
  }, 0);
  return sse / testCount;
}
