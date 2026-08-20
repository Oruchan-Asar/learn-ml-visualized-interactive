import { describe, expect, it } from "vitest";
import { ITEMS, findItem, nearestOfOtherModality, rankOtherModality } from "@/lib/math-core/joint-embedding-spaces";

describe("cross-modal nearest neighbors", () => {
  it("each image's nearest caption is its own true caption", () => {
    expect(nearestOfOtherModality(findItem("Image: dog")).label).toBe("Caption: a dog running");
    expect(nearestOfOtherModality(findItem("Image: cat")).label).toBe("Caption: a cat sleeping");
    expect(nearestOfOtherModality(findItem("Image: bird")).label).toBe("Caption: a bird flying");
  });

  it("each caption's nearest image is its own true image — the relationship is symmetric", () => {
    expect(nearestOfOtherModality(findItem("Caption: a dog running")).label).toBe("Image: dog");
    expect(nearestOfOtherModality(findItem("Caption: a cat sleeping")).label).toBe("Image: cat");
    expect(nearestOfOtherModality(findItem("Caption: a bird flying")).label).toBe("Image: bird");
  });

  it("nearestOfOtherModality never returns an item of the same modality", () => {
    for (const item of ITEMS) {
      expect(nearestOfOtherModality(item).modality).not.toBe(item.modality);
    }
  });
});

describe("ranking every candidate of the other modality", () => {
  it("the dog image's ranking has its true caption first by a wide margin", () => {
    const ranking = rankOtherModality(findItem("Image: dog"));
    expect(ranking[0].item.label).toBe("Caption: a dog running");
    expect(ranking[0].d).toBeCloseTo(0.2828, 3);
    expect(ranking[1].d).toBeGreaterThan(ranking[0].d * 5);
  });

  it("the bird image's true caption is closer than 0.5 units away, its nearest rival over 3 units away", () => {
    const ranking = rankOtherModality(findItem("Image: bird"));
    expect(ranking[0].d).toBeCloseTo(0.5, 5);
    expect(ranking[1].d).toBeGreaterThan(3);
  });
});
