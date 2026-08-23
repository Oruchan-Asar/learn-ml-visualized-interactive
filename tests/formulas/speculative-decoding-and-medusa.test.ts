import { describe, expect, it } from "vitest";
import {
  TARGET_SEQUENCE,
  DRAFT_LEN,
  DRAFT_ROUNDS,
  runRound,
  simulateSession,
  tokensPerCall,
  BASELINE_TOKENS_PER_CALL,
  CHECKPOINT_REMAINING,
  CHECKPOINT_GUESSES,
} from "@/lib/math-core/speculative-decoding-and-medusa";

describe("speculative-decoding-and-medusa", () => {
  it("a round accepts the matching prefix, then adds one bonus token", () => {
    const result = runRound(["the", "cat", "sat", "on"], ["the", "cat", "dog"]);
    expect(result.accepted).toBe(2);
    expect(result.emitted).toEqual(["the", "cat", "sat"]);
  });

  it("a fully-correct round still gets a bonus token if the target continues", () => {
    const result = runRound(["a", "b", "c", "d"], ["a", "b", "c"]);
    expect(result.accepted).toBe(3);
    expect(result.emitted).toEqual(["a", "b", "c", "d"]);
  });

  it("no bonus token once the target is exhausted", () => {
    const result = runRound(["a", "b"], ["a", "b", "c"]);
    expect(result.accepted).toBe(2);
    expect(result.emitted).toEqual(["a", "b"]);
  });

  it("the full session emits all 8 target tokens in exactly 3 rounds", () => {
    const session = simulateSession();
    expect(session.totalTokens).toBe(TARGET_SEQUENCE.length);
    expect(session.totalCalls).toBe(3);
    expect(session.rounds.map((r) => r.emitted.length)).toEqual([3, 3, 2]);
  });

  it("throughput beats one token per call, the autoregressive baseline", () => {
    const session = simulateSession();
    expect(tokensPerCall(session)).toBeCloseTo(8 / 3, 10);
    expect(tokensPerCall(session)).toBeGreaterThan(BASELINE_TOKENS_PER_CALL);
  });

  it("draft rounds propose DRAFT_LEN tokens each", () => {
    DRAFT_ROUNDS.forEach((round) => expect(round).toHaveLength(DRAFT_LEN));
  });

  it("an unseen round resolves to an exact emitted-token count", () => {
    const result = runRound(CHECKPOINT_REMAINING, CHECKPOINT_GUESSES);
    expect(result.accepted).toBe(2);
    expect(result.emitted).toEqual(["is", "fun", "today"]);
  });
});
