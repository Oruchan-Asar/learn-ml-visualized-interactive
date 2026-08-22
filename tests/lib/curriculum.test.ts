import { describe, it, expect } from "vitest";
import { CURRICULUM, getChapterMeta, getChapterNeighbors } from "@/lib/curriculum";
import { ABBREVIATIONS } from "@/lib/abbreviations";

describe("Curriculum Master Structure", () => {
  it("contains exactly 200 chapters", () => {
    expect(CURRICULUM.length).toBe(200);
  });

  it("spans exactly 20 unique parts", () => {
    const parts = new Set(CURRICULUM.map((c) => c.part));
    expect(parts.size).toBe(20);
  });

  it("has strictly unique slugs for every chapter", () => {
    const slugs = new Set(CURRICULUM.map((c) => c.slug));
    expect(slugs.size).toBe(200);
  });

  it("contains exactly 20 capstone chapters (one per part)", () => {
    const capstones = CURRICULUM.filter((c) => c.capstone);
    expect(capstones.length).toBe(20);

    const partsWithCapstone = new Set(capstones.map((c) => c.part));
    expect(partsWithCapstone.size).toBe(20);
  });

  it("getChapterMeta returns correct chapter metadata", () => {
    const first = getChapterMeta("what-is-a-derivative");
    expect(first.title).toBe("What is a derivative?");
    expect(first.chapterNumber).toBe(1);

    const grpo = getChapterMeta("group-relative-policy-optimization-grpo");
    expect(grpo.title).toContain("Group Relative Policy Optimization");

    expect(() => getChapterMeta("non-existent-slug-xyz")).toThrow();
  });

  it("getChapterNeighbors links prev and next correctly", () => {
    const first = getChapterNeighbors("what-is-a-derivative");
    expect(first.index).toBe(0);
    expect(first.prev).toBeNull();
    expect(first.next?.slug).toBe("the-gradient-in-multiple-dimensions");

    const last = getChapterNeighbors("capstone-design-a-monitored-serving-pipeline");
    expect(last.index).toBe(199);
    expect(last.next).toBeNull();
    expect(last.prev?.slug).toBe("model-monitoring-and-drift");
  });
});

describe("Abbreviations Database", () => {
  it("has non-empty abbreviations with valid properties", () => {
    expect(ABBREVIATIONS.length).toBeGreaterThan(100);
    for (const entry of ABBREVIATIONS) {
      expect(entry.abbr.length).toBeGreaterThan(0);
      expect(entry.longForm.length).toBeGreaterThan(0);
      expect(entry.chapters.length).toBeGreaterThan(0);
    }
  });

  it("is sorted alphabetically case-insensitively", () => {
    for (let i = 1; i < ABBREVIATIONS.length; i++) {
      const prev = ABBREVIATIONS[i - 1].abbr;
      const curr = ABBREVIATIONS[i].abbr;
      expect(prev.localeCompare(curr, undefined, { sensitivity: "base" })).toBeLessThanOrEqual(0);
    }
  });
});
