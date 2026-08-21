import { describe, it, expect } from "vitest";
import { contextWindowAt, inContextWindow, overlapScore, retrieve, MESSAGES, QUERY_INDEX } from "@/lib/math-core/agent-memory";

describe("contextWindowAt", () => {
  it("holds only the last 4 messages at t=6", () => {
    const window = contextWindowAt(6);
    expect(window.map((m) => m.id)).toEqual([3, 4, 5, 6]);
  });

  it("the fact (message 0) is still in the window through t=3, gone from t=4 onward", () => {
    expect(inContextWindow(0, 3)).toBe(true);
    expect(inContextWindow(0, 4)).toBe(false);
    expect(inContextWindow(0, 5)).toBe(false);
    expect(inContextWindow(0, 6)).toBe(false);
  });

  it("t=4 is the smallest t among {2,3,4,5} where the fact has fallen out", () => {
    const candidates = [2, 3, 4, 5];
    const firstMissing = candidates.find((t) => !inContextWindow(0, t));
    expect(firstMissing).toBe(4);
  });
});

describe("overlapScore", () => {
  it("counts shared keywords longer than 3 letters", () => {
    expect(overlapScore("What's my favorite color?", "My favorite color is teal.")).toBe(2);
  });

  it("is zero for genuinely unrelated sentences", () => {
    expect(overlapScore("What's my favorite color?", "Can you help me plan a trip?")).toBe(0);
  });
});

describe("retrieve", () => {
  it("finds the fact even though it's long gone from the context window", () => {
    const result = retrieve(MESSAGES[QUERY_INDEX].text);
    expect(result.id).toBe(0);
    expect(result.text).toBe("My favorite color is teal.");
  });

  it("never returns the query message itself, since it only searches strictly earlier messages", () => {
    const result = retrieve(MESSAGES[QUERY_INDEX].text);
    expect(result.id).not.toBe(QUERY_INDEX);
  });
});
