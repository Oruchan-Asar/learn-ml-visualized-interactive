/**
 * A toy stand-in for half precision (FP16/BF16): it keeps only a few significant decimal digits
 * and flushes anything smaller than a representable floor to exactly zero -- the two properties of
 * low precision that actually matter for training, made hand-checkable with round decimal numbers
 * instead of real 10-bit mantissas and 2^-24-scale denormal floors.
 */
export const TOY_FP16_SIG_DIGITS = 3;
export const TOY_FP16_MIN_MAGNITUDE = 1e-4;

export function roundToSigFigs(x: number, digits: number): number {
  if (x === 0) return 0;
  const magnitude = Math.ceil(Math.log10(Math.abs(x)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(x * factor) / factor;
}

/** Casts a value into the toy low-precision format: rounds to a few significant digits, and underflows to 0 below the floor. */
export function toToyFp16(x: number): number {
  if (Math.abs(x) < TOY_FP16_MIN_MAGNITUDE) return 0;
  return roundToSigFigs(x, TOY_FP16_SIG_DIGITS);
}

// ---- Loss scaling: rescue a small gradient from underflowing to zero ----

/** A real gradient that's too small to survive the toy format on its own. */
export const G_RAW = 5e-5;
export const SCALE_DOMAIN: [number, number] = [1, 8];
export const TARGET_SCALE = 2;

/**
 * Multiplies the gradient by `scale` before it's cast to low precision, then divides the stored
 * (rounded) value back down by the same scale -- the core trick of dynamic loss scaling. If the
 * scaled gradient still underflows, the recovered value is 0; once `scale` is big enough to lift
 * it above the floor, the true gradient comes back out exactly.
 */
export function recoveredGradient(scale: number): number {
  const scaled = G_RAW * scale;
  const stored = toToyFp16(scaled);
  return stored / scale;
}

// ---- FP32 master weights: why the weight itself can't just live in FP16 ----

export const MASTER_WEIGHT = 1.234567;
export const TINY_UPDATE = -0.0001;
export const NUM_STEPS = 10;

/** Naive fp16-only training: the weight itself is stored in low precision, so a tiny update can vanish on contact. */
export function updateInToyFp16(weight: number, update: number): number {
  const stored = toToyFp16(weight);
  return toToyFp16(stored + update);
}

export function fp16OnlyAfterSteps(steps: number): number {
  let w = MASTER_WEIGHT;
  for (let i = 0; i < steps; i++) w = updateInToyFp16(w, TINY_UPDATE);
  return w;
}

/** Mixed precision keeps a full-precision master copy: the update always lands, step after step. */
export function fp32MasterAfterSteps(steps: number): number {
  return MASTER_WEIGHT + steps * TINY_UPDATE;
}
