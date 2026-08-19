/** Core check behind every "manipulate-to-target" checkpoint: is the live value close enough to the goal? */
export function withinTolerance(value: number, target: number, tolerance: number): boolean {
  return Math.abs(value - target) <= tolerance;
}

/** Same idea, for a 2D point target (e.g. a vector that should land near another one). */
export function withinDistance(
  point: { x: number; y: number },
  target: { x: number; y: number },
  tolerance: number,
): boolean {
  const dx = point.x - target.x;
  const dy = point.y - target.y;
  return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}
