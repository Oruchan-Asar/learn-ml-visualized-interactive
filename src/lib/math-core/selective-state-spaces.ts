/**
 * Last chapter's A, B, C were the same three numbers at every timestep — the state decayed by the same
 * factor whether the current token mattered or not. A selective state-space model (the mechanism behind
 * Mamba) lets A and B depend on the current input, so the model can choose, per token, whether to keep
 * writing or leave the state alone entirely.
 *
 * This chapter's selection rule is the simplest one that still makes the point: a token is either
 * "signal" (nonzero) or "filler" (exactly zero). On filler, freeze the state completely — A=1, B=0. On
 * signal, forget the old state completely and write the new value in its place — A=0, B=1.
 */
export const FIXED_A = 0.5;
export const FIXED_B = 1;

export const SEQUENCE: number[] = [5, 0, 0, 0, -3, 0, 0];

/** The non-selective rule from last chapter: the same decay every step, whether or not the current token carries any information. */
export function fixedStep(hPrev: number, x: number, a: number = FIXED_A, b: number = FIXED_B): number {
  return a * hPrev + b * x;
}

/** The selection function: is this token worth writing to the state at all? Here, "worth writing" just means nonzero. */
export function isSignal(x: number): boolean {
  return x !== 0;
}

/** The selective rule: freeze the state on filler (A=1, B=0), overwrite it on signal (A=0, B=1) — the update itself depends on the current token. */
export function selectiveStep(hPrev: number, x: number): number {
  return isSignal(x) ? x : hPrev;
}

export interface SelectiveTrace {
  fixed: number[]; // fixed[0] = h_0 = 0; fixed[t] after SEQUENCE[t-1]
  selective: number[];
}

/** Runs both rules over the same sequence, so their states can be compared step by step. */
export function runBoth(xs: number[] = SEQUENCE): SelectiveTrace {
  const fixed: number[] = [0];
  const selective: number[] = [0];
  for (const x of xs) {
    fixed.push(fixedStep(fixed[fixed.length - 1], x));
    selective.push(selectiveStep(selective[selective.length - 1], x));
  }
  return { fixed, selective };
}
