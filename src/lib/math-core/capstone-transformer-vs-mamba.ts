import { attentionOps, D_MODEL } from "./the-quadratic-bottleneck";
import { ssmMemory, attentionMemory } from "./state-space-models";
import { selectiveStep } from "./selective-state-spaces";

/**
 * One planted fact, buried in an otherwise-empty sequence — the simplest possible version of the "needle
 * in a haystack" task real long-context benchmarks use. Both a Transformer and a selective SSM can find
 * it exactly, at any sequence length. What differs isn't correctness; it's what each architecture has to
 * pay to get there.
 */
export const CANDIDATE_LENGTHS = [8, 16, 32, 64, 128];
export const SIGNAL_POSITION = 5;
export const SIGNAL_VALUE = 7;

export function buildSequence(n: number, signalPos: number = SIGNAL_POSITION, signalValue: number = SIGNAL_VALUE): number[] {
  return Array.from({ length: n }, (_, i) => (i === signalPos ? signalValue : 0));
}

/** The selective SSM's answer: scan once, freeze on filler, write on signal — same mechanism as last chapter, on a much longer sequence. */
export function selectiveRecall(xs: number[]): number {
  let h = 0;
  for (const x of xs) h = selectiveStep(h, x);
  return h;
}

/** A Transformer-style pass's cost to process a sequence of length n — the full n² attention matrix from Chapter 1. */
export function transformerCost(n: number, d: number = D_MODEL): number {
  return attentionOps(n, d);
}

/** A selective SSM's cost to process the same sequence: one O(1) step per token, so the total is O(n). */
export function mambaCost(n: number): number {
  return n;
}

export function transformerMemory(n: number): number {
  return attentionMemory(n);
}

export function mambaMemory(): number {
  return ssmMemory();
}
