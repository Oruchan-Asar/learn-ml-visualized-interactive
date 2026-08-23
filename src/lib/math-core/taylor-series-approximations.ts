/** The function being approximated: f(x) = x^3. */
export function f(x: number): number {
  return x ** 3;
}

/** f'(x) = 3x^2. */
export function fPrime(x: number): number {
  return 3 * x * x;
}

/** f''(x) = 6x. */
export function fDoublePrime(x: number): number {
  return 6 * x;
}

/** First-order (linear/tangent-line) Taylor approximation of f around x0, evaluated at x. */
export function linearApprox(x0: number, x: number): number {
  return f(x0) + fPrime(x0) * (x - x0);
}

/** Second-order (quadratic) Taylor approximation of f around x0, evaluated at x. */
export function quadraticApprox(x0: number, x: number): number {
  return f(x0) + fPrime(x0) * (x - x0) + 0.5 * fDoublePrime(x0) * (x - x0) ** 2;
}

/** Absolute error between an approximation's value and the true f(x). */
export function approxError(approxValue: number, x: number): number {
  return Math.abs(f(x) - approxValue);
}

export const DOMAIN: [number, number] = [-2.2, 2.2];
