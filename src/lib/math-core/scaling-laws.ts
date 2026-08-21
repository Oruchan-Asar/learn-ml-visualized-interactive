/**
 * A synthetic but exact power-law relationship between model size and loss: L(N) = A * N^-alpha.
 * Training runs at four small sizes reveal the law; fitting a line through log(N) vs log(L) lets
 * you predict the loss at a much larger size you never actually trained.
 */
export const TRUE_A = 100;
export const TRUE_ALPHA = 0.5;

export function trueLoss(n: number): number {
  return TRUE_A * Math.pow(n, -TRUE_ALPHA);
}

export const TRAIN_SIZES: number[] = [1, 4, 9, 16];
export const TRAIN_LOSSES: number[] = TRAIN_SIZES.map(trueLoss);

export interface LinearFit {
  slope: number;
  intercept: number;
}

/** Ordinary least squares — the same fit used throughout this course. */
export function fitLine(xs: number[], ys: number[]): LinearFit {
  const n = xs.length;
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

/** Fitting in log-log space: log(L) = intercept + slope * log(N), so slope = -alpha, intercept = log(A). */
export function fitScalingLaw(sizes: number[] = TRAIN_SIZES, losses: number[] = TRAIN_LOSSES): LinearFit {
  return fitLine(sizes.map(Math.log), losses.map(Math.log));
}

export function predictLossLogLog(fit: LinearFit, n: number): number {
  return Math.exp(fit.intercept + fit.slope * Math.log(n));
}

/** The common mistake: fitting a straight line directly to the raw (N, loss) pairs, no log transform. */
export function fitRawLinear(sizes: number[] = TRAIN_SIZES, losses: number[] = TRAIN_LOSSES): LinearFit {
  return fitLine(sizes, losses);
}

export function predictLossRawLinear(fit: LinearFit, n: number): number {
  return fit.intercept + fit.slope * n;
}

export const TEST_SIZE = 100;
