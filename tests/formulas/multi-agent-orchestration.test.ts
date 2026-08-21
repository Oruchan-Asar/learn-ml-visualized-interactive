import { describe, it, expect } from "vitest";
import { researchAgent, writerAgent, correctHandoff, brokenHandoff, TOPICS } from "@/lib/math-core/multi-agent-orchestration";

describe("researchAgent", () => {
  it("returns a structured object, not a plain string", () => {
    const result = researchAgent("Mount Everest");
    expect(result.topic).toBe("Mount Everest");
    expect(result.fact).toBe("is the tallest mountain above sea level");
  });
});

describe("writerAgent", () => {
  it("combines subject and fact into one sentence", () => {
    expect(writerAgent("Mount Everest", "is tall")).toBe("Mount Everest is tall.");
  });
});

describe("correctHandoff", () => {
  it("produces a correct, readable sentence for every topic", () => {
    expect(correctHandoff("Mount Everest")).toBe("Mount Everest is the tallest mountain above sea level.");
    expect(correctHandoff("The Pacific Ocean")).toBe("The Pacific Ocean is the largest and deepest ocean on Earth.");
    expect(correctHandoff("Saturn")).toBe("Saturn has the most extensive ring system of any planet.");
  });
});

describe("brokenHandoff", () => {
  it("stringifies the whole object into '[object Object]' instead of the fact", () => {
    expect(brokenHandoff("Mount Everest")).toBe("Mount Everest [object Object].");
  });

  it("produces this exact garbage for every topic, not just one", () => {
    for (const topic of TOPICS) {
      expect(brokenHandoff(topic)).toBe(`${topic} [object Object].`);
    }
  });

  it("never crashes — the bug is silent, not a thrown error", () => {
    for (const topic of TOPICS) {
      expect(() => brokenHandoff(topic)).not.toThrow();
    }
  });
});

describe("checkpoint fact: exactly one topic's correct sentence mentions rings", () => {
  it("only Saturn's sentence contains the word 'ring'", () => {
    const matches = TOPICS.filter((t) => correctHandoff(t).includes("ring"));
    expect(matches).toEqual(["Saturn"]);
  });
});
