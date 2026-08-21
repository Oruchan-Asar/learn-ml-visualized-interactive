import { solveLinearSystem, noisyYs } from "./bias-variance";

function designMatrix(xs: number[], degree: number): number[][] {
  return xs.map((x) => {
    const row: number[] = [];
    let acc = 1;
    for (let k = 0; k <= degree; k++) {
      row.push(acc);
      acc *= x;
    }
    return row;
  });
}

/** Ridge (L2): minimizes squared error + λ‖β‖² for every coefficient except the intercept. Closed-form via normal equations. */
export function ridgeFit(xs: number[], ys: number[], degree: number, lambda: number): number[] {
  const x = designMatrix(xs, degree);
  const p = degree + 1;
  const xtx = Array.from({ length: p }, () => new Array(p).fill(0));
  const xty = new Array(p).fill(0);
  for (let i = 0; i < xs.length; i++) {
    for (let r = 0; r < p; r++) {
      xty[r] += x[i][r] * ys[i];
      for (let c = 0; c < p; c++) xtx[r][c] += x[i][r] * x[i][c];
    }
  }
  for (let j = 1; j < p; j++) xtx[j][j] += lambda;
  return solveLinearSystem(xtx, xty);
}

function softThreshold(value: number, gamma: number): number {
  if (value > gamma) return value - gamma;
  if (value < -gamma) return value + gamma;
  return 0;
}

/** Lasso (L1): minimizes mean squared error + λ‖β‖₁ for every coefficient except the intercept, via cyclic coordinate descent. */
export function lassoFit(xs: number[], ys: number[], degree: number, lambda: number, iterations = 500): number[] {
  const x = designMatrix(xs, degree);
  const n = xs.length;
  const p = degree + 1;
  const beta = new Array(p).fill(0);
  const columnSumSquares = new Array(p).fill(0);
  for (let j = 0; j < p; j++) {
    for (let i = 0; i < n; i++) columnSumSquares[j] += x[i][j] ** 2;
  }

  const predict = (i: number) => {
    let acc = 0;
    for (let j = 0; j < p; j++) acc += x[i][j] * beta[j];
    return acc;
  };

  for (let iter = 0; iter < iterations; iter++) {
    for (let j = 0; j < p; j++) {
      let rho = 0;
      for (let i = 0; i < n; i++) {
        const predictionWithoutJ = predict(i) - x[i][j] * beta[j];
        rho += x[i][j] * (ys[i] - predictionWithoutJ);
      }
      beta[j] = j === 0 ? rho / columnSumSquares[j] : softThreshold(rho, n * lambda) / columnSumSquares[j];
    }
  }
  return beta;
}

export const REG_DEGREE = 4;
export const REG_YS = noisyYs(0);
export const LAMBDA_MAX = 2;
