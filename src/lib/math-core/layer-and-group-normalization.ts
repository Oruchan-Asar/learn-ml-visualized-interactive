/**
 * One example's hidden-layer output -- 6 channels, fixed and hand-checkable. Batch normalization
 * (previous chapter) would normalize each of these channels using statistics gathered *across a
 * batch* of examples. Layer/group normalization instead compute statistics *across these very
 * channels, for this one example* -- so they need no batch at all.
 */
export const ACTIVATIONS: number[] = [2, -1, 0.5, 3, -2.5, 1];
export const NUM_CHANNELS = ACTIVATIONS.length;
export const EPS = 1e-5;

/** Divisors of NUM_CHANNELS: how many equal groups the channels can be split into. */
export const VALID_NUM_GROUPS = [1, 2, 3, 6];

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function variance(xs: number[]): number {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
}

/**
 * Splits `activations` into `numGroups` equal contiguous groups and normalizes each group
 * independently to zero mean, unit variance. numGroups=1 normalizes across all channels at once
 * (exactly LayerNorm); numGroups=NUM_CHANNELS normalizes each channel against only itself
 * (every value's own mean, so it always comes out 0 -- the degenerate limit of too many groups).
 */
export function groupNormalize(activations: number[], numGroups: number): number[] {
  const groupSize = activations.length / numGroups;
  const out = new Array(activations.length);
  for (let g = 0; g < numGroups; g++) {
    const start = g * groupSize;
    const group = activations.slice(start, start + groupSize);
    const m = mean(group);
    const std = Math.sqrt(variance(group) + EPS);
    for (let i = 0; i < groupSize; i++) out[start + i] = (group[i] - m) / std;
  }
  return out;
}

export const GROUP_LABELS: Record<number, string> = {
  1: "Layer norm (1 group)",
  2: "Group norm (2 groups)",
  3: "Group norm (3 groups)",
  6: "Instance norm (6 groups)",
};

/** The group size at which every normalized value comes out exactly +-1 -- true for any 2-element group. */
export const UNIFORM_PM_ONE_NUM_GROUPS = 3;
export const UNIFORM_PM_ONE_TOLERANCE = 0.001;
