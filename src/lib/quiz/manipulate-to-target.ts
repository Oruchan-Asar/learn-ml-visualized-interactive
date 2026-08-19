/** Core check behind every "manipulate-to-target" checkpoint: is the live value close enough to the goal? */
export function withinTolerance(value: number, target: number, tolerance: number): boolean {
  return Math.abs(value - target) <= tolerance;
}
