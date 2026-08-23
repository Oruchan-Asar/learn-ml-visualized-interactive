export interface Vec2 {
  x: number;
  y: number;
}

/** f(x,y) = x² + 10y² — steep in y, shallow in x. The same "ravine" shape as the Momentum chapter. */
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
 * One step of classical momentum: v' = β·v + ∇f(point), point' = point - η·v'.
 * The gradient is evaluated at the *current* point.
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

/**
 * The Nesterov "look-ahead" point: where momentum alone would carry us before this
 * step's gradient is even computed.
 */
export function lookaheadPoint(state: MomentumState, learningRate: number, beta: number): Vec2 {
  return {
    x: state.point.x - learningRate * beta * state.velocity.x,
    y: state.point.y - learningRate * beta * state.velocity.y,
  };
}

/**
 * One step of Nesterov accelerated gradient (NAG): identical bookkeeping to `momentumStep`,
 * except the gradient is evaluated at the look-ahead point instead of the current point —
 * the step "peeks ahead" along the direction momentum is already carrying it.
 */
export function nesterovStep(
  state: MomentumState,
  gradientFn: (x: number, y: number) => Vec2,
  learningRate: number,
  beta: number,
): MomentumState {
  const lookahead = lookaheadPoint(state, learningRate, beta);
  const g = gradientFn(lookahead.x, lookahead.y);
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
