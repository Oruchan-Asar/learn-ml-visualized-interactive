/**
 * A 4x4 pretrained weight matrix is frozen; the task needs a specific update on top of it. That
 * update happens to be exactly rank-1 — the realistic assumption LoRA makes about real fine-tuning
 * updates — so a full 16-parameter update and a 8-parameter low-rank one (two length-4 vectors)
 * can both, in principle, represent it exactly.
 */
export const N = 4;
export const A_TRUE: number[] = [1, 2, -1, 3];
export const B_TRUE: number[] = [2, 1, 0, -1];

export function outerProduct(a: number[], b: number[]): number[][] {
  return a.map((ai) => b.map((bj) => ai * bj));
}

/** The true weight update the task needs — a full n x n matrix, but rank-1 by construction. */
export const TARGET_DELTA_W: number[][] = outerProduct(A_TRUE, B_TRUE);

// --- Full fine-tuning: n^2 = 16 independent scalar parameters, one per matrix entry ---
export function fullFineTuneStep(W: number[][], target: number[][], learningRate: number): number[][] {
  return W.map((row, i) => row.map((w, j) => w - learningRate * 2 * (w - target[i][j])));
}

export function fullFineTuneTrace(steps: number, learningRate: number, target: number[][] = TARGET_DELTA_W): number[][][] {
  const trace: number[][][] = [Array.from({ length: N }, () => Array(N).fill(0))];
  let W = trace[0];
  for (let i = 0; i < steps; i++) {
    W = fullFineTuneStep(W, target, learningRate);
    trace.push(W);
  }
  return trace;
}

// --- LoRA: 2n = 8 parameters, two length-4 vectors whose outer product approximates the update ---
export interface LoraParams {
  a: number[];
  b: number[];
}

export function loraLoss(params: LoraParams, target: number[][] = TARGET_DELTA_W): number {
  const approx = outerProduct(params.a, params.b);
  let sum = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      sum += (target[i][j] - approx[i][j]) ** 2;
    }
  }
  return sum;
}

function loraGradients(params: LoraParams, target: number[][]): LoraParams {
  const { a, b } = params;
  const gradA = new Array(N).fill(0);
  const gradB = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const residual = a[i] * b[j] - target[i][j];
      gradA[i] += 2 * residual * b[j];
      gradB[j] += 2 * residual * a[i];
    }
  }
  return { a: gradA, b: gradB };
}

export function loraStep(params: LoraParams, target: number[][], learningRate: number): LoraParams {
  const grad = loraGradients(params, target);
  return {
    a: params.a.map((v, i) => v - learningRate * grad.a[i]),
    b: params.b.map((v, j) => v - learningRate * grad.b[j]),
  };
}

export function trainLora(steps: number, learningRate: number, start: LoraParams, target: number[][] = TARGET_DELTA_W): LoraParams[] {
  const trace: LoraParams[] = [start];
  let params = start;
  for (let i = 0; i < steps; i++) {
    params = loraStep(params, target, learningRate);
    trace.push(params);
  }
  return trace;
}

export const LORA_START: LoraParams = { a: [0.1, 0.1, 0.1, 0.1], b: [0.1, 0.1, 0.1, 0.1] };
export const FULL_FINE_TUNE_PARAM_COUNT = N * N;
export const LORA_PARAM_COUNT = 2 * N;
