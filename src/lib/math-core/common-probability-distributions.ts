/** Bernoulli(p): P(X=1) = p, P(X=0) = 1 - p. */
export function bernoulliPmf(p: number, k: 0 | 1): number {
  return k === 1 ? p : 1 - p;
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** Poisson(lambda): P(X=k) = e^-lambda * lambda^k / k!. */
export function poissonPmf(lambda: number, k: number): number {
  return Math.exp(-lambda) * lambda ** k / factorial(k);
}

/** Gaussian pdf with mean mu and standard deviation sigma. */
export function gaussianPdf(x: number, mu: number, sigma: number): number {
  const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
  return coeff * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
}

/** Dirichlet(alpha): the mean of the probability vector it generates, alpha_i / sum(alpha). Exact fractions. */
export function dirichletMean(alpha: number[]): number[] {
  const total = alpha.reduce((s, a) => s + a, 0);
  return alpha.map((a) => a / total);
}

/** Dirichlet(alpha): the mode of the probability vector, (alpha_i - 1) / (sum(alpha) - k). Requires every alpha_i > 1. */
export function dirichletMode(alpha: number[]): number[] {
  const total = alpha.reduce((s, a) => s + a, 0);
  const k = alpha.length;
  return alpha.map((a) => (a - 1) / (total - k));
}
