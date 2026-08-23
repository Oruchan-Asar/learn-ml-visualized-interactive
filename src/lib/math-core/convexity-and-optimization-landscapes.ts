export interface Vec2 {
  x: number;
  y: number;
}

/** The three second partials of a 2D scalar field at a point. */
export interface Hessian2 {
  fxx: number;
  fxy: number;
  fyy: number;
}

/** A convex bowl: f(x,y) = x^2 + y^2. One global minimum, at the origin. */
export function bowl(x: number, y: number): number {
  return x * x + y * y;
}

export function bowlGradient(x: number, y: number): Vec2 {
  return { x: 2 * x, y: 2 * y };
}

/** The bowl's Hessian is constant everywhere: [[2,0],[0,2]]. */
export function bowlHessian(): Hessian2 {
  return { fxx: 2, fxy: 0, fyy: 2 };
}

/**
 * A non-convex landscape with two symmetric minima and a saddle point between them:
 * f(x,y) = (x^2 - 2)^2 + y^2. Slicing along y=0 reproduces a classic 1D double well;
 * the y-direction adds a second axis for a genuine saddle at the origin.
 */
export function landscape(x: number, y: number): number {
  return (x * x - 2) ** 2 + y * y;
}

/** ∇f = (4x(x^2-2), 2y). */
export function landscapeGradient(x: number, y: number): Vec2 {
  return { x: 4 * x * (x * x - 2), y: 2 * y };
}

/** Hessian of the landscape: fxx = 12x^2 - 8, fxy = 0, fyy = 2. */
export function landscapeHessian(x: number): Hessian2 {
  return { fxx: 12 * x * x - 8, fxy: 0, fyy: 2 };
}

export function determinant(h: Hessian2): number {
  return h.fxx * h.fyy - h.fxy * h.fxy;
}

export type CriticalPointType = "minimum" | "maximum" | "saddle" | "inconclusive";

/** The second-derivative test: classify a critical point from its Hessian's determinant and top-left entry. */
export function classifyCriticalPoint(h: Hessian2): CriticalPointType {
  const det = determinant(h);
  if (det < 0) return "saddle";
  if (det === 0) return "inconclusive";
  return h.fxx > 0 ? "minimum" : "maximum";
}

export const LANDSCAPE_MINIMUM_X = Math.sqrt(2);

/** The landscape's three critical points: the saddle at the origin, and the two wells at x = ±√2. */
export const LANDSCAPE_CRITICAL_POINTS: { point: Vec2; label: string }[] = [
  { point: { x: 0, y: 0 }, label: "the ridge between the wells" },
  { point: { x: Math.sqrt(2), y: 0 }, label: "the right well" },
  { point: { x: -Math.sqrt(2), y: 0 }, label: "the left well" },
];

export const DOMAIN: [number, number] = [-2.5, 2.5];
export const GRADIENT_ZERO_TOLERANCE = 1.2;
