import { toToyFp16 } from "./mixed-precision-training";
import { constantLR, warmupCosineLR } from "./learning-rate-schedules";
import { rms, rmsNormalize } from "./rmsnorm";
import { decoupledDecay } from "./weight-decay-vs-l2";

/**
 * A 20-layer network, deliberately initialized with too small a weight scale (the same failure
 * mode as Part IX's vanishing-gradients chapter) -- but now with four independent, toggleable
 * fixes from this part layered on top, reusing the actual functions from their own chapters:
 * RMSNorm (rmsNormalize) after every layer, dynamic loss scaling (toToyFp16) for fp16 training,
 * LR warmup (warmupCosineLR), and decoupled weight decay (decoupledDecay). Flip them on one at a
 * time and watch each of the network's separate failure modes disappear.
 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNormalGenerator(seed: number): () => number {
  const rng = mulberry32(seed);
  return function () {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

export const FAN_IN = 4;
export const DEPTH = 20;
export const BAD_SCALE = 0.25;

const normalGen = makeNormalGenerator(11);
const WEIGHTS: number[][][] = Array.from({ length: DEPTH }, () =>
  Array.from({ length: FAN_IN }, () => Array.from({ length: FAN_IN }, () => normalGen())),
);
const INPUT: number[] = Array.from({ length: FAN_IN }, () => normalGen());

export interface Toggles {
  normalize: boolean;
  lossScaling: boolean;
  warmup: boolean;
  weightDecay: boolean;
}

/**
 * Plain RMS magnitude, with no epsilon floor -- used only for *reporting* how small a gradient
 * really is. rmsnorm's own `rms` includes an epsilon meant to keep a normalization's denominator
 * away from zero; reusing it here would floor every reported magnitude at sqrt(EPS) ~ 0.003,
 * masking the very vanishing-gradient behavior this capstone exists to show.
 */
function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0) / v.length);
}

function matVec(w: number[][], v: number[]): number[] {
  return w.map((row) => row.reduce((s, wij, j) => s + wij * v[j], 0));
}

function transposeMatVec(w: number[][], v: number[]): number[] {
  const out = new Array(FAN_IN).fill(0);
  for (let i = 0; i < FAN_IN; i++) {
    for (let j = 0; j < FAN_IN; j++) out[j] += w[i][j] * v[i];
  }
  return out;
}

interface LayerTrace {
  preNorm: number[];
}

function runForward(useNorm: boolean): LayerTrace[] {
  const trace: LayerTrace[] = [];
  let h = INPUT;
  for (let l = 0; l < DEPTH; l++) {
    const preNorm = matVec(WEIGHTS[l], h).map((x) => x * BAD_SCALE);
    // Reuses the RMSNorm chapter's own function, at gain 1 -- this *is* an RMSNorm layer, not a lookalike.
    const post = useNorm ? rmsNormalize(preNorm, 1) : preNorm;
    trace.push({ preNorm });
    h = post;
  }
  return trace;
}

/**
 * Backward pass through the same chain. RMSNorm's backward is simplified here to "divide by the
 * same per-layer RMS used going forward" -- exact if that layer's RMS is treated as a constant,
 * which is the standard first-order way to build intuition for why normalization keeps the
 * backward signal from shrinking the same way the forward signal would without it.
 */
function runBackward(useNorm: boolean, trace: LayerTrace[]): number[][] {
  const grads: number[][] = new Array(DEPTH + 1);
  grads[DEPTH] = new Array(FAN_IN).fill(1); // a fixed incoming loss gradient -- isolates the chain's own attenuation
  for (let l = DEPTH - 1; l >= 0; l--) {
    let g = grads[l + 1];
    if (useNorm) {
      const layerRms = rms(trace[l].preNorm); // the RMSNorm chapter's own rms(), epsilon included
      g = g.map((x) => x / layerRms);
    }
    grads[l] = transposeMatVec(WEIGHTS[l], g).map((x) => x * BAD_SCALE);
  }
  return grads;
}

/** RMS gradient magnitude at every layer, index 0 = the gradient that reaches the input. */
export function gradientMagnitudes(useNorm: boolean): number[] {
  const trace = runForward(useNorm);
  const grads = runBackward(useNorm, trace);
  return grads.map(rms);
}

export const SAMPLE_LAYERS = [0, 5, 10, 15, 20];
export const LOSS_SCALE = 1024;

/** The gradient magnitude at each sampled layer, as it would actually be stored under fp16 training. */
export function sampledGradientMagnitudes(useNorm: boolean, useLossScaling: boolean): number[] {
  const full = gradientMagnitudes(useNorm);
  return SAMPLE_LAYERS.map((l) => {
    const raw = full[l];
    if (!useLossScaling) return toToyFp16(raw);
    const scaled = raw * LOSS_SCALE;
    return toToyFp16(scaled) / LOSS_SCALE;
  });
}

export const HEALTHY_FLOOR = 0.3;

// ---- LR warmup: does the very first update stay a safe size? ----
export function step0UpdateSize(useWarmup: boolean, gradMagnitude: number): number {
  const lr = useWarmup ? warmupCosineLR(0) : constantLR(0);
  return lr * gradMagnitude;
}
export const UNSAFE_UPDATE_THRESHOLD = 0.5;

// ---- Decoupled weight decay: does the weight magnitude stay bounded over many steps? ----
export const WEIGHT_GROWTH_PER_STEP = 0.05;
// With weight-decay-vs-l2's LR=0.1, decoupledDecay(w, DECAY_LAMBDA) = 0.1 * 0.5 * w = 0.05*w -- a 5% per-step shrink.
export const DECAY_LAMBDA = 0.5;
export const TRAINING_STEPS = 50;
export const W0 = 1;

/** Each step, the weight first grows (an unchecked update), then -- if enabled -- the chapter's own decoupledDecay shrinks it back down by a fixed fraction, regardless of that step's gradient history. */
export function weightAfterSteps(useDecay: boolean): number {
  let w = W0;
  for (let i = 0; i < TRAINING_STEPS; i++) {
    w = w * (1 + WEIGHT_GROWTH_PER_STEP);
    if (useDecay) w -= decoupledDecay(w, DECAY_LAMBDA);
  }
  return w;
}
export const WEIGHT_BOUND = 5;

export function isHealthy(toggles: Toggles): boolean {
  const sampled = sampledGradientMagnitudes(toggles.normalize, toggles.lossScaling);
  const inputGradHealthy = sampled[0] > HEALTHY_FLOOR;
  const rawInputGrad = gradientMagnitudes(toggles.normalize)[0];
  const warmupSafe = step0UpdateSize(toggles.warmup, rawInputGrad) < UNSAFE_UPDATE_THRESHOLD;
  const weightBounded = weightAfterSteps(toggles.weightDecay) < WEIGHT_BOUND;
  return inputGradHealthy && warmupSafe && weightBounded;
}
