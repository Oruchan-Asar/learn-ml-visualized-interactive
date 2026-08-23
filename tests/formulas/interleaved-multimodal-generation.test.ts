import { describe, expect, it } from "vitest";
import {
  SCRIPT,
  VOCAB,
  vocabId,
  stepWeights,
  stepWinner,
  generateSequence,
  sequenceAtStep,
  candidateEmbedding,
} from "@/lib/math-core/interleaved-multimodal-generation";
import { patchEmbedding } from "@/lib/math-core/patch-projectors-and-image-tokenization";

describe("stepWeights: softmax over one step's candidate logits", () => {
  it("sums to 1 and favors the highest-logit candidate on step 1", () => {
    const weights = stepWeights(SCRIPT[0]);
    expect(weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 10);
    expect(weights[0]).toBeGreaterThan(weights[1]);
    expect(weights[1]).toBeGreaterThan(weights[2]);
  });

  it("matches hand-computed softmax([2, -1, -1])", () => {
    const weights = stepWeights(SCRIPT[3]); // step 4: logits [2, -1, -1]
    const denom = Math.exp(2) + Math.exp(-1) + Math.exp(-1);
    expect(weights[0]).toBeCloseTo(Math.exp(2) / denom, 6);
    expect(weights[0]).toBeCloseTo(0.909, 3);
  });
});

describe("stepWinner: argmax decoding picks the same token an image-blind model would never choose specially", () => {
  it("chooses a text token for the first three steps", () => {
    expect(stepWinner(SCRIPT[0]).label).toBe("a");
    expect(stepWinner(SCRIPT[1]).label).toBe("photo");
    expect(stepWinner(SCRIPT[2]).label).toBe("of");
  });

  it("hands off to image tokens for exactly steps 4 through 7, in patch order", () => {
    expect(stepWinner(SCRIPT[3])).toMatchObject({ label: "top-left", modality: "image", patchIndex: 0 });
    expect(stepWinner(SCRIPT[4])).toMatchObject({ label: "top-right", modality: "image", patchIndex: 1 });
    expect(stepWinner(SCRIPT[5])).toMatchObject({ label: "bottom-left", modality: "image", patchIndex: 2 });
    expect(stepWinner(SCRIPT[6])).toMatchObject({ label: "bottom-right", modality: "image", patchIndex: 3 });
  });

  it("hands back to text for the remaining three steps", () => {
    expect(stepWinner(SCRIPT[7]).label).toBe("on");
    expect(stepWinner(SCRIPT[8]).label).toBe("the");
    expect(stepWinner(SCRIPT[9]).label).toBe("mat");
  });
});

describe("generateSequence / sequenceAtStep", () => {
  it("produces the full interleaved sequence: 3 words, 4 image tokens, 3 words", () => {
    const seq = generateSequence();
    expect(seq.map((c) => c.label)).toEqual([
      "a", "photo", "of", "top-left", "top-right", "bottom-left", "bottom-right", "on", "the", "mat",
    ]);
    expect(seq.filter((c) => c.modality === "image")).toHaveLength(4);
  });

  it("sequenceAtStep(n) is a strict prefix of the full sequence", () => {
    expect(sequenceAtStep(4).map((c) => c.label)).toEqual(["a", "photo", "of", "top-left"]);
    expect(sequenceAtStep(0)).toEqual([]);
  });
});

describe("VOCAB: one flat vocabulary shared by text and image tokens", () => {
  it("assigns every distinct label a unique id, with no separate id space per modality", () => {
    const ids = VOCAB.map((label) => vocabId(label));
    expect(new Set(ids).size).toBe(VOCAB.length);
    expect(vocabId("a")).toBe(0);
    expect(VOCAB).toContain("top-left");
  });
});

describe("candidateEmbedding: image tokens reuse real embeddings from the patch-projector chapter", () => {
  it("returns the exact patch embedding for an image-modality candidate", () => {
    const winner = stepWinner(SCRIPT[3]); // "top-left", patchIndex 0
    expect(candidateEmbedding(winner)).toEqual(patchEmbedding(0));
  });

  it("returns null for a text-modality candidate", () => {
    const winner = stepWinner(SCRIPT[0]); // "a"
    expect(candidateEmbedding(winner)).toBeNull();
  });
});
