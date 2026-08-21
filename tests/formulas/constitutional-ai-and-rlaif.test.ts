import { describe, it, expect } from "vitest";
import { violatesPrinciple, critique, revise, PAIRS } from "@/lib/math-core/constitutional-ai-and-rlaif";

describe("violatesPrinciple", () => {
  it("flags any response containing the password, case-insensitively", () => {
    expect(violatesPrinciple("your password is hunter2")).toBe(true);
    expect(violatesPrinciple("your password is HUNTER2")).toBe(true);
    expect(violatesPrinciple("I can't share that")).toBe(false);
  });
});

describe("critique", () => {
  it("prefers B when A reveals the password and B doesn't", () => {
    const result = critique(PAIRS[0]);
    expect(result.winner).toBe("b");
  });

  it("prefers B when A reveals the password and B doesn't (pair 1)", () => {
    const result = critique(PAIRS[1]);
    expect(result.winner).toBe("b");
  });

  it("prefers A when B reveals the password and A doesn't (pair 2)", () => {
    const result = critique(PAIRS[2]);
    expect(result.winner).toBe("a");
  });
});

describe("revise", () => {
  it("redacts the password from a violating response", () => {
    expect(revise("Your password is hunter2.")).toBe("Your password is [REDACTED].");
  });

  it("leaves a non-violating response completely unchanged", () => {
    const safe = "I can't share your password directly, but I can help you reset it.";
    expect(revise(safe)).toBe(safe);
  });

  it("redacts every occurrence, not just the first", () => {
    expect(revise("hunter2 is your password. Confirm: hunter2?")).toBe("[REDACTED] is your password. Confirm: [REDACTED]?");
  });

  it("a revised response never violates the principle anymore", () => {
    for (const pair of PAIRS) {
      expect(violatesPrinciple(revise(pair.a))).toBe(false);
      expect(violatesPrinciple(revise(pair.b))).toBe(false);
    }
  });
});

describe("checkpoint fact: exactly one response per pair violates the principle", () => {
  it("every pair has exactly one violating response", () => {
    for (const pair of PAIRS) {
      const count = [pair.a, pair.b].filter(violatesPrinciple).length;
      expect(count).toBe(1);
    }
  });
});
