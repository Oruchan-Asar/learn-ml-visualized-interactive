export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * A GRU cell has two gates where an LSTM has three (input, forget, output) plus a separate
 * cell state — the update gate z folds "how much to forget" and "how much to write" into one
 * knob, and there's no cell state distinct from the hidden state at all.
 */
export interface GRUWeights {
  Wz: number;
  Uz: number;
  bz: number;
  Wr: number;
  Ur: number;
  br: number;
  W: number;
  U: number;
  b: number;
}

/** Update gate biased strongly toward "keep the old state"; reset gate biased open. */
export const WEIGHTS: GRUWeights = { Wz: 0, Uz: 0, bz: -4, Wr: 0, Ur: 0, br: 4, W: 1, U: 0.5, b: 0 };
export const INPUT_X = 1;

export interface GRUState {
  z: number;
  r: number;
  hCandidate: number;
  h: number;
}

/** One GRU step: z decides how much of the new candidate to blend in, r decides how much old state the candidate itself sees. */
export function gruStep(hPrev: number, x: number = INPUT_X, w: GRUWeights = WEIGHTS): GRUState {
  const z = sigmoid(w.Wz * x + w.Uz * hPrev + w.bz);
  const r = sigmoid(w.Wr * x + w.Ur * hPrev + w.br);
  const hCandidate = Math.tanh(w.W * x + w.U * (r * hPrev) + w.b);
  const h = (1 - z) * hPrev + z * hCandidate;
  return { z, r, hCandidate, h };
}

export function gruSequence(steps: number, x: number = INPUT_X, w: GRUWeights = WEIGHTS): GRUState[] {
  const states: GRUState[] = [];
  let h = 0;
  for (let t = 0; t < steps; t++) {
    const s = gruStep(h, x, w);
    states.push(s);
    h = s.h;
  }
  return states;
}

/**
 * Gradient of the final hidden state w.r.t. the first, dominated by the product of (1 - update
 * gate) at every step — the GRU's own memory highway, built from one gate instead of the LSTM's
 * forget gate plus separate cell state, but preserving gradient the same way.
 */
export function gruGradientProduct(steps: number, updateGate: number): number {
  return Math.pow(1 - updateGate, steps - 1);
}
