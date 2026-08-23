/**
 * Every piece of a real deep learning framework, wired together: a Tensor-shaped forward pass
 * (layers of weights and activations), a loss function, reverse-mode autodiff (backprop) computing
 * every gradient at once, and an optimizer applying the update. The forward/backward pair here is the
 * same one Chapters 4-6 built by hand; the one new piece is swapping plain gradient descent for
 * **AdamW** — Adam (Chapter 9) plus decoupled weight decay, the optimizer most real frameworks default to.
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

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export interface XorPoint {
  x: number;
  y: number;
  label: string;
}

/** The classic minimal example of a pattern no single line can separate — same network shape as the MLP chapter's hand-built one, but with learned rather than hand-picked weights. */
export const XOR_POINTS: XorPoint[] = [
  { x: 0, y: 0, label: "A" },
  { x: 0, y: 1, label: "B" },
  { x: 1, y: 0, label: "B" },
  { x: 1, y: 1, label: "A" },
];

export const HIDDEN_SIZE = 4;
export const XOR_DOMAIN: [number, number] = [-0.6, 1.6];

/** The Tensor abstraction here: every parameter of the network, as one plain nested-number object. */
export interface MlpWeights {
  w1: number[][]; // HIDDEN_SIZE x 2 — layer 1's weights
  b1: number[]; // HIDDEN_SIZE — layer 1's biases
  w2: number[]; // HIDDEN_SIZE — layer 2's weights
  b2: number; // layer 2's bias
}

/** Fresh random weights, deterministic (seeded) so every run of the app starts from the same point. */
export function initialWeights(): MlpWeights {
  const gen = makeNormalGenerator(2024);
  return {
    w1: Array.from({ length: HIDDEN_SIZE }, () => [gen() * 0.8, gen() * 0.8]),
    b1: Array.from({ length: HIDDEN_SIZE }, () => 0),
    w2: Array.from({ length: HIDDEN_SIZE }, () => gen() * 0.8),
    b2: 0,
  };
}

function zerosLike(weights: MlpWeights): MlpWeights {
  return {
    w1: weights.w1.map((row) => row.map(() => 0)),
    b1: weights.b1.map(() => 0),
    w2: weights.w2.map(() => 0),
    b2: 0,
  };
}

/** The Layer forward pass: two matrix-multiply-and-squash steps, exactly Chapter 4's forward pass. */
export function forward(weights: MlpWeights, x1: number, x2: number): { h: number[]; output: number } {
  const h = weights.w1.map((w, i) => sigmoid(w[0] * x1 + w[1] * x2 + weights.b1[i]));
  const z2 = h.reduce((sum, hi, i) => sum + weights.w2[i] * hi, 0) + weights.b2;
  return { h, output: sigmoid(z2) };
}

function labelToTarget(label: string): number {
  return label === XOR_POINTS[0].label ? 0 : 1;
}

/** The loss function: mean squared error over all four XOR points. */
export function meanLoss(weights: MlpWeights): number {
  let total = 0;
  for (const p of XOR_POINTS) {
    const { output } = forward(weights, p.x, p.y);
    total += 0.5 * (output - labelToTarget(p.label)) ** 2;
  }
  return total / XOR_POINTS.length;
}

/** Reverse-mode autodiff (backprop): every parameter's gradient, in one full-batch pass over all four points. */
export function computeGradients(weights: MlpWeights): MlpWeights {
  const gW1 = weights.w1.map(() => [0, 0]);
  const gB1 = weights.b1.map(() => 0);
  const gW2 = weights.w2.map(() => 0);
  let gB2 = 0;

  for (const p of XOR_POINTS) {
    const { h, output } = forward(weights, p.x, p.y);
    const target = labelToTarget(p.label);
    const dLoss_dOutput = output - target;
    const dOutput_dz2 = output * (1 - output);
    const dLoss_dz2 = dLoss_dOutput * dOutput_dz2;

    for (let i = 0; i < HIDDEN_SIZE; i++) gW2[i] += dLoss_dz2 * h[i];
    gB2 += dLoss_dz2;

    for (let i = 0; i < HIDDEN_SIZE; i++) {
      const dLoss_dh = dLoss_dz2 * weights.w2[i];
      const dh_dz1 = h[i] * (1 - h[i]);
      const dLoss_dz1 = dLoss_dh * dh_dz1;
      gW1[i][0] += dLoss_dz1 * p.x;
      gW1[i][1] += dLoss_dz1 * p.y;
      gB1[i] += dLoss_dz1;
    }
  }

  const n = XOR_POINTS.length;
  return {
    w1: gW1.map((row) => row.map((g) => g / n)),
    b1: gB1.map((g) => g / n),
    w2: gW2.map((g) => g / n),
    b2: gB2 / n,
  };
}

export const LR = 0.1;
export const BETA1 = 0.9;
export const BETA2 = 0.999;
export const EPS = 1e-8;
export const WEIGHT_DECAY = 0.01;

export interface AdamWState {
  weights: MlpWeights;
  m: MlpWeights;
  v: MlpWeights;
  t: number;
}

export function initialAdamWState(): AdamWState {
  const weights = initialWeights();
  return { weights, m: zerosLike(weights), v: zerosLike(weights) as MlpWeights, t: 0 };
}

/** AdamW's per-parameter update rule — the one new formula this chapter adds on top of Chapter 9's Adam. */
export function adamWUpdate(
  theta: number,
  g: number,
  m: number,
  v: number,
  t: number,
): { theta: number; m: number; v: number } {
  const mNew = BETA1 * m + (1 - BETA1) * g;
  const vNew = BETA2 * v + (1 - BETA2) * g * g;
  const mHat = mNew / (1 - BETA1 ** t);
  const vHat = vNew / (1 - BETA2 ** t);
  const thetaNew = theta - LR * (mHat / (Math.sqrt(vHat) + EPS) + WEIGHT_DECAY * theta);
  return { theta: thetaNew, m: mNew, v: vNew };
}

/** The optimizer step: AdamW applied to every parameter in the network, all sharing one timestep t. */
export function adamWStep(state: AdamWState): AdamWState {
  const grads = computeGradients(state.weights);
  const t = state.t + 1;

  const w1: number[][] = [];
  const mW1: number[][] = [];
  const vW1: number[][] = [];
  for (let i = 0; i < HIDDEN_SIZE; i++) {
    const row: number[] = [];
    const mRow: number[] = [];
    const vRow: number[] = [];
    for (let j = 0; j < 2; j++) {
      const r = adamWUpdate(state.weights.w1[i][j], grads.w1[i][j], state.m.w1[i][j], state.v.w1[i][j], t);
      row.push(r.theta);
      mRow.push(r.m);
      vRow.push(r.v);
    }
    w1.push(row);
    mW1.push(mRow);
    vW1.push(vRow);
  }

  const b1: number[] = [];
  const mB1: number[] = [];
  const vB1: number[] = [];
  for (let i = 0; i < HIDDEN_SIZE; i++) {
    const r = adamWUpdate(state.weights.b1[i], grads.b1[i], state.m.b1[i], state.v.b1[i], t);
    b1.push(r.theta);
    mB1.push(r.m);
    vB1.push(r.v);
  }

  const w2: number[] = [];
  const mW2: number[] = [];
  const vW2: number[] = [];
  for (let i = 0; i < HIDDEN_SIZE; i++) {
    const r = adamWUpdate(state.weights.w2[i], grads.w2[i], state.m.w2[i], state.v.w2[i], t);
    w2.push(r.theta);
    mW2.push(r.m);
    vW2.push(r.v);
  }

  const outB2 = adamWUpdate(state.weights.b2, grads.b2, state.m.b2, state.v.b2, t);

  return {
    weights: { w1, b1, w2, b2: outB2.theta },
    m: { w1: mW1, b1: mB1, w2: mW2, b2: outB2.m },
    v: { w1: vW1, b1: vB1, w2: vW2, b2: outB2.v },
    t,
  };
}

export function trainEpochs(state: AdamWState, epochs: number): AdamWState {
  let current = state;
  for (let i = 0; i < epochs; i++) current = adamWStep(current);
  return current;
}

export const TARGET_LOSS = 0.01;
export const EPOCHS_PER_STEP = 10;
export const MAX_STEPS = 20;
