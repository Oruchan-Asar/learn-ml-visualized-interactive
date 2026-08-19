export interface Vec2 {
  x: number;
  y: number;
}

/** f(x,y) = x² + 10y² — steep in y, shallow in x. A classic "ravine" shape. */
export function f(x: number, y: number): number {
  return x * x + 10 * y * y;
}

export function gradient(x: number, y: number): Vec2 {
  return { x: 2 * x, y: 20 * y };
}

export interface MomentumState {
  point: Vec2;
  velocity: Vec2;
}

/**
 * One step of momentum: v' = β·v + ∇f(point), point' = point - η·v'.
 * Plain gradient descent is exactly this with β=0 — velocity never
 * accumulates, so v' always just equals the current gradient.
 */
export function momentumStep(
  state: MomentumState,
  gradientFn: (x: number, y: number) => Vec2,
  learningRate: number,
  beta: number,
): MomentumState {
  const g = gradientFn(state.point.x, state.point.y);
  const velocity = {
    x: beta * state.velocity.x + g.x,
    y: beta * state.velocity.y + g.y,
  };
  const point = {
    x: state.point.x - learningRate * velocity.x,
    y: state.point.y - learningRate * velocity.y,
  };
  return { point, velocity };
}
