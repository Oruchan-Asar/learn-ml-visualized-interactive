/** A strictly convex bowl: curves upward everywhere, so gradient descent always finds the same minimum. */
export function convexBowl(x: number): number {
  return x * x;
}

export function convexBowlGradient(x: number): number {
  return 2 * x;
}

/** Second derivative of the bowl — constant and positive everywhere, the 1D convexity test passing at every point. */
export function convexBowlSecondDerivative(): number {
  return 2;
}

/**
 * A symmetric double well: two equal global minima at +/-sqrt(2), separated by a local maximum at 0.
 * Not convex — a straight line between the two minima dips below the curve, violating Jensen's
 * inequality — so which minimum gradient descent finds depends entirely on which side of 0 it starts on.
 */
export function doubleWell(x: number): number {
  return x ** 4 - 4 * x ** 2;
}

export function doubleWellGradient(x: number): number {
  return 4 * x ** 3 - 8 * x;
}

/** Second derivative of the double well — negative at 0 (a local max), positive at the two minima. */
export function doubleWellSecondDerivative(x: number): number {
  return 12 * x * x - 8;
}

export const DOUBLE_WELL_MINIMA: [number, number] = [-Math.sqrt(2), Math.sqrt(2)];
export const DOUBLE_WELL_MIN_VALUE = -4;
export const DOUBLE_WELL_LOCAL_MAX_X = 0;

export const DOMAIN: [number, number] = [-2.2, 2.2];
