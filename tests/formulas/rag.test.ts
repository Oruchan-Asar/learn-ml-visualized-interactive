import { describe, expect, it } from "vitest";
import { QUERIES, findQuery, retrieve, rankDocs, generate, DEFAULT_PRIOR_ANSWER } from "@/lib/math-core/rag";

describe("retrieval finds the true matching document for every query", () => {
  it("each query's nearest document is its own true fact", () => {
    expect(retrieve(findQuery("Q: capital of France")).answer).toBe("Paris");
    expect(retrieve(findQuery("Q: capital of Japan")).answer).toBe("Tokyo");
    expect(retrieve(findQuery("Q: capital of Australia")).answer).toBe("Canberra");
  });

  it("the true document always wins by a wide margin over the runner-up", () => {
    for (const q of QUERIES) {
      const ranked = rankDocs(q);
      expect(ranked[1].d).toBeGreaterThan(ranked[0].d * 5);
    }
  });
});

describe("grounding changes the generated answer", () => {
  it("without retrieval, every query gets the same fixed prior answer", () => {
    for (const q of QUERIES) expect(generate(q, false)).toBe(DEFAULT_PRIOR_ANSWER);
  });

  it("with retrieval, Japan and Australia get corrected — the prior was wrong for them", () => {
    expect(generate(findQuery("Q: capital of Japan"), true)).toBe("Tokyo");
    expect(generate(findQuery("Q: capital of Australia"), true)).toBe("Canberra");
    expect(generate(findQuery("Q: capital of Japan"), false)).not.toBe("Tokyo");
    expect(generate(findQuery("Q: capital of Australia"), false)).not.toBe("Canberra");
  });

  it("France happens to match the prior either way — grounding isn't detectable from a single lucky case", () => {
    expect(generate(findQuery("Q: capital of France"), true)).toBe(generate(findQuery("Q: capital of France"), false));
  });
});
