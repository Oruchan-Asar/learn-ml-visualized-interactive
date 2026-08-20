import { describe, expect, it } from "vitest";
import { SEARCH_QUERIES, search, topMatch, margin } from "@/lib/math-core/capstone-image-text-search";

describe("the tiny search engine", () => {
  it("has exactly 3 typeable queries, reused from Chapter 1's captions", () => {
    expect(SEARCH_QUERIES).toEqual([
      "Caption: a dog running",
      "Caption: a cat sleeping",
      "Caption: a bird flying",
    ]);
  });

  it("each query's top match is its true image", () => {
    expect(topMatch("Caption: a dog running").label).toBe("Image: dog");
    expect(topMatch("Caption: a cat sleeping").label).toBe("Image: cat");
    expect(topMatch("Caption: a bird flying").label).toBe("Image: bird");
  });

  it("search results are sorted nearest-first for every query", () => {
    for (const q of SEARCH_QUERIES) {
      const ranked = search(q);
      expect(ranked[0].d).toBeLessThan(ranked[1].d);
      expect(ranked[1].d).toBeLessThan(ranked[2].d);
    }
  });

  it("the margin between winner and runner-up is always over 2 units, a confident search result", () => {
    for (const q of SEARCH_QUERIES) {
      expect(margin(q)).toBeGreaterThan(2);
    }
  });
});
