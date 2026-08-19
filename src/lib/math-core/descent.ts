/**
 * One step of gradient descent: x_{n+1} = x_n - learningRate * gradient(x_n).
 * Generic over any function's gradient, not tied to a specific chapter's f.
 */
export function gradientDescentStep(
  x: number,
  gradient: (x: number) => number,
  learningRate: number,
): number {
  return x - learningRate * gradient(x);
}
