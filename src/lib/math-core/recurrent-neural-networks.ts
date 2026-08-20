import { TOKEN_X, TOKEN_Y, SEQUENCE_A, SEQUENCE_B } from "@/lib/math-core/sequence-order";

export { TOKEN_X, TOKEN_Y, SEQUENCE_A, SEQUENCE_B };

/** Fixed input weights: reward seeing X, penalize seeing Y. Only the recurrent weight varies. */
export const WX = [1, -1];
export const BIAS = 0;

export function rnnStep(x: number[], h: number, wh: number): number {
  return Math.tanh(WX[0] * x[0] + WX[1] * x[1] + wh * h + BIAS);
}

export interface StepTrace {
  t: number;
  token: number[] | null;
  h: number;
}

/** Runs the recurrence over a whole sequence, keeping every intermediate hidden state (t=0 is the initial h=0). */
export function runSequence(sequence: number[][], wh: number): StepTrace[] {
  const trace: StepTrace[] = [{ t: 0, token: null, h: 0 }];
  let h = 0;
  sequence.forEach((token, i) => {
    h = rnnStep(token, h, wh);
    trace.push({ t: i + 1, token, h });
  });
  return trace;
}

export function finalHidden(sequence: number[][], wh: number): number {
  const trace = runSequence(sequence, wh);
  return trace[trace.length - 1].h;
}

export const DEFAULT_WH = 1;
export const DOMAIN: [number, number] = [-2, 6];
export const TARGET_SEPARATION = 1.9;
