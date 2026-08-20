import { describe, expect, it } from "vitest";
import { MERGES, VOCABULARY, tokenize, encode, END_OF_WORD } from "@/lib/math-core/tokenization";

describe("BPE learns merges in the expected order on the classic toy corpus", () => {
  it("first merges e+s (the most frequent pair, from newest and widest)", () => {
    expect(MERGES[0].pair).toEqual(["e", "s"]);
    expect(MERGES[0].merged).toBe("es");
    expect(MERGES[0].count).toBe(9);
  });

  it("then merges es+t into est", () => {
    expect(MERGES[1].pair).toEqual(["es", "t"]);
    expect(MERGES[1].merged).toBe("est");
  });

  it("then merges est+</w> into est</w>", () => {
    expect(MERGES[2].pair).toEqual(["est", END_OF_WORD]);
  });

  it("then merges l+o, then lo+w, forming the low token", () => {
    expect(MERGES[3].pair).toEqual(["l", "o"]);
    expect(MERGES[4].pair).toEqual(["lo", "w"]);
    expect(MERGES[4].merged).toBe("low");
  });
});

describe("tokenizing training words with the learned merges", () => {
  it("'low' becomes a single token", () => {
    expect(tokenize("low")).toEqual(["low", END_OF_WORD]);
  });

  it("'newest' splits into 'ne', 'w', 'est</w>'", () => {
    expect(tokenize("newest")).toEqual(["ne", "w", `est${END_OF_WORD}`]);
  });

  it("'widest' splits into 'w', 'i', 'd', 'est</w>'", () => {
    expect(tokenize("widest")).toEqual(["w", "i", "d", `est${END_OF_WORD}`]);
  });
});

describe("tokenizing a word never seen during training", () => {
  it("'lowest' splits into the reused subwords 'low' and 'est</w>'", () => {
    expect(tokenize("lowest")).toEqual(["low", `est${END_OF_WORD}`]);
  });

  it("both pieces of 'lowest' already exist in the vocabulary — no unknown tokens needed", () => {
    const { tokens, ids } = encode("lowest");
    expect(tokens).toEqual(["low", `est${END_OF_WORD}`]);
    for (const id of ids) {
      expect(id).toBeGreaterThanOrEqual(0);
      expect(VOCABULARY[id]).toBe(tokens[ids.indexOf(id)]);
    }
  });
});
