/**
 * f(x) = x^2 - 4x + 5, a bowl-shaped curve with its minimum at x = 2.
 * Kept as a named, pure function so the chapter, the visualization, and the
 * unit test all call the exact same implementation — never three copies of "the formula."
 */
export function f(x: number): number {
  return x * x - 4 * x + 5;
}

/** Analytic derivative of f: df/dx = 2x - 4. */
export function gradient(x: number): number {
  return 2 * x - 4;
}

/** Central-difference numerical derivative, used only to cross-check `gradient`. */
export function numericalGradient(x: number, h = 1e-4): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}
