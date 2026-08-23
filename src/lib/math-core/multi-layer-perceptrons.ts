/**
 * A single perceptron (Chapter 1) draws one straight line, so it can never separate XOR: (0,0) and
 * (1,1) are one class, (0,1) and (1,0) are the other. This file hand-builds the classic fix — a
 * hidden layer of two perceptrons feeding a third — using nothing but the step function Chapter 1
 * already introduced, so XOR becomes solvable with the same building block, just stacked.
 */
export function step(z: number): number {
  return z >= 0 ? 1 : 0;
}

/** Hidden neuron A: fires like OR(x1, x2). */
export const HIDDEN_A_W: [number, number] = [1, 1];
export const HIDDEN_A_B = -0.5;

/** Hidden neuron B: fires like NAND(x1, x2) — off only when both inputs are on. */
export const HIDDEN_B_W: [number, number] = [-1, -1];
export const HIDDEN_B_B = 1.5;

/** Output neuron's weights are fixed at AND(hA, hB); only its bias is adjustable in the demos. */
export const OUTPUT_W: [number, number] = [1, 1];

export interface XorForward {
  z1A: number;
  hA: number;
  z1B: number;
  hB: number;
  zOut: number;
  y: number;
}

/** Forward pass through the fixed hidden layer and an output neuron whose bias is the one free parameter. */
export function forward(x1: number, x2: number, outputBias: number): XorForward {
  const z1A = HIDDEN_A_W[0] * x1 + HIDDEN_A_W[1] * x2 + HIDDEN_A_B;
  const hA = step(z1A);
  const z1B = HIDDEN_B_W[0] * x1 + HIDDEN_B_W[1] * x2 + HIDDEN_B_B;
  const hB = step(z1B);
  const zOut = OUTPUT_W[0] * hA + OUTPUT_W[1] * hB + outputBias;
  const y = step(zOut);
  return { z1A, hA, z1B, hB, zOut, y };
}

export interface XorPoint {
  x1: number;
  x2: number;
  target: number;
}

export const XOR_POINTS: XorPoint[] = [
  { x1: 0, x2: 0, target: 0 },
  { x1: 0, x2: 1, target: 1 },
  { x1: 1, x2: 0, target: 1 },
  { x1: 1, x2: 1, target: 0 },
];

/** How many of the 4 XOR rows this output bias gets right — the network is only "solved" at 4. */
export function countCorrect(outputBias: number): number {
  return XOR_POINTS.filter((p) => forward(p.x1, p.x2, outputBias).y === p.target).length;
}

export const OUTPUT_BIAS_DOMAIN: [number, number] = [-2.5, 0.5];
/** Same bias an AND gate would use on hA·hB directly — looks reasonable, but only gets half of XOR right. */
export const DEFAULT_OUTPUT_BIAS = 0;
/** -1.5 is the exact AND-gate bias for OUTPUT_W = (1,1): fires only when both hA and hB are on. */
export const TARGET_OUTPUT_BIAS = -1.5;
export const TARGET_CORRECT_COUNT = 4;
