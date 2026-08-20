import { PCA_POINTS, TRUE_DIRECTION, PCA_DOMAIN, type Point2D } from "@/lib/math-core/pca";

export { type Point2D };

/** The exact same seven points from Part II's PCA chapter — mean (0,0), true direction (0.6, 0.8). */
export const POINTS: Point2D[] = PCA_POINTS;
export const DOMAIN: [number, number] = PCA_DOMAIN;

/** A 1D linear autoencoder: encode projects onto a unit direction, decode scales back along it. */
export function encode(p: Point2D, angle: number): number {
  return p.x * Math.cos(angle) + p.y * Math.sin(angle);
}

export function decode(z: number, angle: number): Point2D {
  return { x: z * Math.cos(angle), y: z * Math.sin(angle) };
}

export function reconstruct(p: Point2D, angle: number): Point2D {
  return decode(encode(p, angle), angle);
}

export function reconstructedPoints(points: Point2D[], angle: number): Point2D[] {
  return points.map((p) => reconstruct(p, angle));
}

/** Mean squared reconstruction error over the whole dataset, for a given bottleneck direction angle. */
export function reconstructionError(points: Point2D[], angle: number): number {
  return (
    points.reduce((sum, p) => {
      const r = reconstruct(p, angle);
      return sum + (p.x - r.x) ** 2 + (p.y - r.y) ** 2;
    }, 0) / points.length
  );
}

/** d(reconstructionError)/d(angle), analytically — drives the tangent line in the error-vs-angle view. */
export function reconstructionErrorDerivative(points: Point2D[], angle: number): number {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const sum = points.reduce((acc, p) => {
    const z = p.x * ux + p.y * uy;
    const dz = -p.x * Math.sin(angle) + p.y * Math.cos(angle);
    return acc + z * dz;
  }, 0);
  return (-2 * sum) / points.length;
}

/** The angle that minimizes reconstruction error is exactly Part II's principal direction. */
export const TRUE_ANGLE = Math.atan2(TRUE_DIRECTION.y, TRUE_DIRECTION.x);
export const MIN_ERROR = reconstructionError(POINTS, TRUE_ANGLE);
export const ANGLE_DOMAIN: [number, number] = [0, Math.PI];
export const TARGET_ERROR = MIN_ERROR + 0.05;
