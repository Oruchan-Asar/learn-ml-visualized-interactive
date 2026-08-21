import { describe, it, expect } from "vitest";
import { trueAnswer, freeTextGuess, guessError, respond, QUERIES } from "@/lib/math-core/function-calling-and-tool-use";

describe("trueAnswer", () => {
  it("matches exact multiplication for every query", () => {
    expect(trueAnswer(QUERIES[0])).toBe(4826);
    expect(trueAnswer(QUERIES[1])).toBe(11106);
    expect(trueAnswer(QUERIES[2])).toBe(4234);
  });
});

describe("freeTextGuess", () => {
  it("matches the hand-computed rounded-operand guess for every query", () => {
    expect(freeTextGuess(QUERIES[0])).toBe(4000); // round(127)->100, round(38)->40
    expect(freeTextGuess(QUERIES[1])).toBe(9000); // round(1234)->1000, round(9)->9
    expect(freeTextGuess(QUERIES[2])).toBe(4200); // round(58)->60, round(73)->70
  });
});

describe("guessError", () => {
  it("matches the hand-computed gap between the guess and the true answer", () => {
    expect(guessError(QUERIES[0])).toBe(826);
    expect(guessError(QUERIES[1])).toBe(2106);
    expect(guessError(QUERIES[2])).toBe(34);
  });

  it("query 1 has the largest guess error of the three", () => {
    const errors = QUERIES.map(guessError);
    expect(errors.indexOf(Math.max(...errors))).toBe(1);
  });
});

describe("respond", () => {
  it("returns the exact answer as a tool_call when a tool is available", () => {
    const r = respond(QUERIES[0], true);
    expect(r.type).toBe("tool_call");
    expect(r.value).toBe(4826);
  });

  it("falls back to the imprecise free_text_guess when no tool is available", () => {
    const r = respond(QUERIES[0], false);
    expect(r.type).toBe("free_text_guess");
    expect(r.value).toBe(4000);
  });
});
