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

export const VOCAB = ["a", "b", "c"];
export const VOCAB_SIZE = VOCAB.length;
export const EMBED_DIM = 3;
export const CONTEXT_LENGTH = 3;
export const HIDDEN_DIM = 3;

export function charIndex(c: string): number {
  return VOCAB.indexOf(c);
}

export interface TrainingExample {
  context: number[];
  target: number;
}

/** Sliding windows over the repeating pattern "abcabc..." — only 3 distinct (context, next-char) pairs exist. */
export const EXAMPLES: TrainingExample[] = [
  { context: [0, 1, 2], target: 0 }, // "abc" -> "a"
  { context: [1, 2, 0], target: 1 }, // "bca" -> "b"
  { context: [2, 0, 1], target: 2 }, // "cab" -> "c"
];

export interface TinyTransformerParams {
  charEmbed: number[][];
  posEmbed: number[][];
  W1: number[][];
  b1: number[];
  W2: number[][];
  b2: number[];
  Wout: number[][];
  bout: number[];
}

const SEED = 2024;

/** Fresh random parameters, deterministic (seeded) so every run of the app starts from the same point. */
export function initialParams(): TinyTransformerParams {
  const gen = makeNormalGenerator(SEED);
  const mat = (rows: number, cols: number) =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => gen() * 0.4));
  const vec = (n: number) => Array.from({ length: n }, () => 0);
  return {
    charEmbed: mat(VOCAB_SIZE, EMBED_DIM),
    posEmbed: mat(CONTEXT_LENGTH, EMBED_DIM),
    W1: mat(HIDDEN_DIM, EMBED_DIM),
    b1: vec(HIDDEN_DIM),
    W2: mat(EMBED_DIM, HIDDEN_DIM),
    b2: vec(EMBED_DIM),
    Wout: mat(VOCAB_SIZE, EMBED_DIM),
    bout: vec(VOCAB_SIZE),
  };
}

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function relu(x: number): number {
  return Math.max(0, x);
}

function layerNorm(v: number[], eps = 1e-5): number[] {
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const variance = v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length;
  const std = Math.sqrt(variance + eps);
  return v.map((x) => (x - mean) / std);
}

function addVec(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

export interface ForwardResult {
  embeddings: number[][];
  attentionWeights: number[][];
  probs: number[];
}

/**
 * One tiny Transformer block (identity-projection self-attention, add & norm, feedforward, add & norm)
 * followed by a linear head over the last position's output, predicting the next character.
 */
export function forward(params: TinyTransformerParams, context: number[]): ForwardResult {
  const x = context.map((ci, pos) => addVec(params.charEmbed[ci], params.posEmbed[pos]));
  const scores = x.map((qi) => x.map((kj) => dot(qi, kj) / Math.sqrt(EMBED_DIM)));
  const attentionWeights = scores.map((row) => softmax(row));
  const attnOut = attentionWeights.map((w) =>
    x.reduce((acc, t, i) => addVec(acc, t.map((v) => v * w[i])), new Array(EMBED_DIM).fill(0)),
  );
  const r1 = x.map((t, i) => addVec(t, attnOut[i]));
  const n1 = r1.map((v) => layerNorm(v));
  const ffnOut = n1.map((v) => {
    const hidden = params.W1.map((row, i) => relu(dot(row, v) + params.b1[i]));
    return params.W2.map((row, i) => dot(row, hidden) + params.b2[i]);
  });
  const r2 = n1.map((v, i) => addVec(v, ffnOut[i]));
  const n2 = r2.map((v) => layerNorm(v));
  const last = n2[n2.length - 1];
  const logits = params.Wout.map((row, i) => dot(row, last) + params.bout[i]);
  return { embeddings: x, attentionWeights, probs: softmax(logits) };
}

export function meanLoss(params: TinyTransformerParams, examples: TrainingExample[] = EXAMPLES): number {
  let total = 0;
  for (const ex of examples) {
    const { probs } = forward(params, ex.context);
    total += -Math.log(probs[ex.target]);
  }
  return total / examples.length;
}

function flattenParams(p: TinyTransformerParams): number[] {
  return [
    ...p.charEmbed.flat(),
    ...p.posEmbed.flat(),
    ...p.W1.flat(),
    ...p.b1,
    ...p.W2.flat(),
    ...p.b2,
    ...p.Wout.flat(),
    ...p.bout,
  ];
}

function unflattenParams(flat: number[]): TinyTransformerParams {
  let idx = 0;
  const readMat = (rows: number, cols: number) => {
    const m: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) row.push(flat[idx++]);
      m.push(row);
    }
    return m;
  };
  const readVec = (n: number) => {
    const v: number[] = [];
    for (let i = 0; i < n; i++) v.push(flat[idx++]);
    return v;
  };
  return {
    charEmbed: readMat(VOCAB_SIZE, EMBED_DIM),
    posEmbed: readMat(CONTEXT_LENGTH, EMBED_DIM),
    W1: readMat(HIDDEN_DIM, EMBED_DIM),
    b1: readVec(HIDDEN_DIM),
    W2: readMat(EMBED_DIM, HIDDEN_DIM),
    b2: readVec(EMBED_DIM),
    Wout: readMat(VOCAB_SIZE, EMBED_DIM),
    bout: readVec(VOCAB_SIZE),
  };
}

export const GRAD_EPS = 1e-3;

/**
 * Gradients computed numerically (finite differences on the loss) rather than an analytic backward
 * pass through attention and layer norm — with only ~50 parameters this is cheap, and it keeps the
 * focus on the architecture itself rather than a second, even longer chain-rule derivation.
 */
export function numericGradient(params: TinyTransformerParams, eps = GRAD_EPS): number[] {
  const flat = flattenParams(params);
  const base = meanLoss(params);
  return flat.map((orig, i) => {
    const bumped = flat.slice();
    bumped[i] = orig + eps;
    const lossPlus = meanLoss(unflattenParams(bumped));
    return (lossPlus - base) / eps;
  });
}

export const LEARNING_RATE = 0.5;
export const EPOCHS_PER_STEP = 20;
export const TARGET_LOSS = 0.02;
export const MAX_STEPS = 15;

export function trainStep(params: TinyTransformerParams, learningRate = LEARNING_RATE): TinyTransformerParams {
  const flat = flattenParams(params);
  const grad = numericGradient(params);
  return unflattenParams(flat.map((v, i) => v - learningRate * grad[i]));
}

export function trainEpochs(params: TinyTransformerParams, epochs: number): TinyTransformerParams {
  let current = params;
  for (let i = 0; i < epochs; i++) current = trainStep(current);
  return current;
}

export function predictNext(params: TinyTransformerParams, context: number[]): number {
  const { probs } = forward(params, context);
  let best = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
  return best;
}

/** Generates `count` more characters autoregressively, starting from a seed context, sliding the window forward. */
export function generate(params: TinyTransformerParams, seedContext: number[], count: number): string {
  let ctx = seedContext.slice();
  let result = ctx.map((i) => VOCAB[i]).join("");
  for (let i = 0; i < count; i++) {
    const next = predictNext(params, ctx);
    result += VOCAB[next];
    ctx = [...ctx.slice(1), next];
  }
  return result;
}
