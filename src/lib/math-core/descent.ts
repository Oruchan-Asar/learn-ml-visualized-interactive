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

/** Same update rule, one dimension up: (x,y)_{n+1} = (x,y)_n - learningRate * gradient(x_n, y_n). */
export function gradientDescentStep2D(
  point: { x: number; y: number },
  gradient: (x: number, y: number) => { x: number; y: number },
  learningRate: number,
): { x: number; y: number } {
  const g = gradient(point.x, point.y);
  return {
    x: point.x - learningRate * g.x,
    y: point.y - learningRate * g.y,
  };
}
