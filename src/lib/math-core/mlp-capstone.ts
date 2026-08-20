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

/** The classic minimal example of a pattern no single line can separate. */
export const XOR_POINTS: XorPoint[] = [
  { x: 0, y: 0, label: "A" },
  { x: 0, y: 1, label: "B" },
  { x: 1, y: 0, label: "B" },
  { x: 1, y: 1, label: "A" },
];

export const HIDDEN_SIZE = 4;
export const LEARNING_RATE = 2.0;
export const XOR_DOMAIN: [number, number] = [-0.6, 1.6];

export interface MlpWeights {
  w1: number[][]; // HIDDEN_SIZE x 2
  b1: number[]; // HIDDEN_SIZE
  w2: number[]; // HIDDEN_SIZE
  b2: number;
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

export function forward(weights: MlpWeights, x1: number, x2: number): { h: number[]; output: number } {
  const h = weights.w1.map((w, i) => sigmoid(w[0] * x1 + w[1] * x2 + weights.b1[i]));
  const z2 = h.reduce((sum, hi, i) => sum + weights.w2[i] * hi, 0) + weights.b2;
  return { h, output: sigmoid(z2) };
}

function labelToTarget(label: string): number {
  return label === XOR_POINTS[0].label ? 0 : 1;
}

export function meanLoss(weights: MlpWeights): number {
  let total = 0;
  for (const p of XOR_POINTS) {
    const { output } = forward(weights, p.x, p.y);
    total += 0.5 * (output - labelToTarget(p.label)) ** 2;
  }
  return total / XOR_POINTS.length;
}

/** One full-batch gradient descent step over all four XOR points, via backprop through both layers. */
export function trainStep(weights: MlpWeights, learningRate = LEARNING_RATE): MlpWeights {
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
    w1: weights.w1.map((w, i) => [w[0] - (learningRate * gW1[i][0]) / n, w[1] - (learningRate * gW1[i][1]) / n]),
    b1: weights.b1.map((b, i) => b - (learningRate * gB1[i]) / n),
    w2: weights.w2.map((w, i) => w - (learningRate * gW2[i]) / n),
    b2: weights.b2 - (learningRate * gB2) / n,
  };
}

export function trainEpochs(weights: MlpWeights, epochs: number): MlpWeights {
  let current = weights;
  for (let i = 0; i < epochs; i++) current = trainStep(current);
  return current;
}

export const TARGET_LOSS = 0.01;
export const EPOCHS_PER_STEP = 50;
export const MAX_STEPS = 30;
