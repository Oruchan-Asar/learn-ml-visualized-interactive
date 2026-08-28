import { describe, it, expect } from "vitest";
import {
  N,
  SECRET_X,
  PUBLIC_Y,
  commit,
  respond,
  verify,
  honestRound,
  impostorRound,
  cheatProbability,
  roundsNeededFor,
} from "@/lib/math-core/zero-knowledge-proofs";

describe("public setup", () => {
  it("matches a hand-worked example: y = x^2 mod n", () => {
    expect(N).toBe(91);
    expect(SECRET_X).toBe(5);
    expect(PUBLIC_Y).toBe(25);
  });
});

describe("commit / respond / verify, an honest round", () => {
  it("matches a hand-worked example for r=4", () => {
    expect(commit(4)).toBe(16);
    expect(respond(4, 0)).toBe(4);
    expect(respond(4, 1)).toBe(20);
  });

  it("passes verification on the challenge=0 branch (reveal r)", () => {
    expect(verify(commit(4), 0, respond(4, 0))).toBe(true);
  });

  it("passes verification on the challenge=1 branch (reveal r*x mod n)", () => {
    expect(verify(commit(4), 1, respond(4, 1))).toBe(true);
  });

  it("honestRound always passes, for either challenge", () => {
    expect(honestRound(4, 0).passed).toBe(true);
    expect(honestRound(4, 1).passed).toBe(true);
    expect(honestRound(7, 1).passed).toBe(true);
  });
});

describe("impostorRound", () => {
  it("an impostor's guess fails verification on the branch they didn't prepare for", () => {
    // Impostor prepares for challenge=0 honestly (reveals r=4), but has no valid z for challenge=1
    // since they don't know x — their best-effort guess of 4 (reusing r) fails.
    const result = impostorRound(4, 1, 4);
    expect(result.passed).toBe(false);
  });

  it("still passes on the branch the impostor did prepare for (challenge=0)", () => {
    expect(impostorRound(4, 0, 999).passed).toBe(true);
  });
});

describe("cheatProbability", () => {
  it("matches hand-worked values: (1/2)^rounds", () => {
    expect(cheatProbability(1)).toBeCloseTo(0.5, 10);
    expect(cheatProbability(4)).toBeCloseTo(0.0625, 10);
    expect(cheatProbability(5)).toBeCloseTo(0.03125, 10);
  });

  it("strictly decreases as rounds increase", () => {
    expect(cheatProbability(5)).toBeLessThan(cheatProbability(4));
  });
});

describe("roundsNeededFor", () => {
  it("finds 5 rounds needed to push cheat probability at or below 5%", () => {
    expect(roundsNeededFor(0.05)).toBe(5);
    expect(cheatProbability(4)).toBeGreaterThan(0.05);
    expect(cheatProbability(5)).toBeLessThanOrEqual(0.05);
  });

  it("finds 1 round sufficient for a lenient 50% threshold", () => {
    expect(roundsNeededFor(0.5)).toBe(1);
  });
});
