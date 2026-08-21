/**
 * Both attention and a state-space model process a sequence one token at a time, but they keep
 * fundamentally different things around while they do it. Attention (even the linear kind from last
 * chapter) still needs the running state built from every key seen so far. A state-space model goes
 * further: it collapses everything before the current token into one fixed-size hidden state, updated by
 * a plain linear recurrence — no growing cache of anything.
 */
export const A = 0.5; // decay: how much of the previous state survives into the next step
export const B = 1; // input gain: how much the current token adds to the state
export const C = 2; // output gain: how the hidden state is read back out

export const SEQUENCE: number[] = [1, -1, 2, 0.5, -0.5];

/** One recurrence step: h_t = A·h_{t-1} + B·x_t — the entire "memory" of everything before t is this one number. */
export function step(hPrev: number, x: number, a: number = A, b: number = B): number {
  return a * hPrev + b * x;
}

/** Reads a token's output from the current hidden state: y_t = C·h_t. */
export function output(h: number, c: number = C): number {
  return c * h;
}

export interface SSMTrace {
  states: number[]; // states[0] is h_0 = 0; states[t] is the state after processing SEQUENCE[t-1]
  outputs: number[]; // outputs[t] corresponds to SEQUENCE[t]
}

/** Runs the whole sequence through the recurrence, keeping every intermediate state and output for inspection. */
export function runSequence(xs: number[] = SEQUENCE, a: number = A, b: number = B, c: number = C): SSMTrace {
  const states: number[] = [0];
  const outputs: number[] = [];
  let h = 0;
  for (const x of xs) {
    h = step(h, x, a, b);
    states.push(h);
    outputs.push(output(h, c));
  }
  return { states, outputs };
}

/** A state-space model's memory footprint: one fixed-size hidden state, regardless of how many tokens it's already seen. */
export function ssmMemory(): number {
  return 1;
}

/** Attention's memory footprint: every past token's key and value has to stay around to be attended to later — this grows with n. */
export function attentionMemory(n: number): number {
  return n;
}
