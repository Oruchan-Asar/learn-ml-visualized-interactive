export interface Vec2 {
  x: number;
  y: number;
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function magnitude(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** Angle between two vectors, in degrees, via the a·b = |a||b|cos(θ) identity. */
export function angleBetweenDegrees(a: Vec2, b: Vec2): number {
  const cos = dot(a, b) / (magnitude(a) * magnitude(b));
  const clamped = Math.min(1, Math.max(-1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
}
