/** Inner function: u = f(x) = 2x + 1 */
export function f(x: number): number {
  return 2 * x + 1;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for a uniform (x) => number signature
export function fPrime(x: number): number {
  return 2;
}

/** Outer function: y = g(u) = u^2 */
export function g(u: number): number {
  return u * u;
}

export function gPrime(u: number): number {
  return 2 * u;
}

/** The composition h(x) = g(f(x)) = (2x + 1)^2. */
export function h(x: number): number {
  return g(f(x));
}

/** dh/dx via the chain rule: g'(f(x)) * f'(x). */
export function hPrime(x: number): number {
  return gPrime(f(x)) * fPrime(x);
}

/** Central-difference numerical derivative of h, used only to cross-check `hPrime`. */
export function numericalHPrime(x: number, eps = 1e-4): number {
  return (h(x + eps) - h(x - eps)) / (2 * eps);
}
