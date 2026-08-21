/**
 * A normalizing flow builds a complicated distribution out of a trivial one by pushing it through an
 * invertible, differentiable function — and because the function is invertible, the resulting density is
 * exact, not approximate: the change-of-variables formula says exactly how much the function stretches
 * or compresses probability mass at every point.
 */
export const BASE_DENSITY = 1; // Z ~ Uniform(0, 1): flat density of 1 on the whole support

/** The flow: x = f(z) = z². Strictly increasing on [0, 1], so it's invertible there. */
export function flowForward(z: number): number {
  return z * z;
}

/** The inverse: z = f⁻¹(x) = √x. */
export function flowInverse(x: number): number {
  return Math.sqrt(x);
}

/** df/dz = 2z — how much the flow locally stretches (>1) or compresses (<1) space at z. */
export function flowDerivative(z: number): number {
  return 2 * z;
}

/**
 * The change-of-variables formula in one dimension: p_X(x) = p_Z(f⁻¹(x)) / |df/dz| evaluated at
 * z = f⁻¹(x). Every place the flow stretches space thins the density there; every place it compresses
 * space concentrates it — probability mass is conserved, just redistributed.
 */
export function transformedDensity(x: number): number {
  const z = flowInverse(x);
  return BASE_DENSITY / flowDerivative(z);
}

export const CHECKPOINT_CANDIDATES = [0.04, 0.16, 0.36, 0.64];
