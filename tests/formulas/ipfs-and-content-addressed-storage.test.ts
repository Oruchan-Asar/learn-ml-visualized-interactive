import { describe, it, expect } from "vitest";
import {
  contentAddress,
  isDuplicate,
  chunkedRootAddress,
  groupByAddress,
  uniqueBlockCount,
  SAMPLE_FILES,
} from "@/lib/math-core/ipfs-and-content-addressed-storage";

describe("contentAddress", () => {
  it("matches a hand-worked example", () => {
    expect(contentAddress("meow")).toBe(840);
    expect(contentAddress("woof")).toBe(343);
  });

  it("is a pure function of content: identical bytes always get the identical address", () => {
    expect(contentAddress("meow")).toBe(contentAddress("meow"));
  });

  it("changes completely for a one-character edit", () => {
    expect(contentAddress("meow!")).toBe(73);
    expect(contentAddress("meow!")).not.toBe(contentAddress("meow"));
  });
});

describe("isDuplicate", () => {
  it("is true for identical content regardless of what it's called", () => {
    expect(isDuplicate("meow", "meow")).toBe(true);
  });

  it("is false the moment even one byte differs", () => {
    expect(isDuplicate("meow", "meow!")).toBe(false);
    expect(isDuplicate("meow", "woof")).toBe(false);
  });
});

describe("chunkedRootAddress", () => {
  it("matches a hand-worked example", () => {
    expect(chunkedRootAddress("meow", "woof")).toBe(754);
  });

  it("changes completely when either chunk changes by one byte", () => {
    expect(chunkedRootAddress("meow!", "woof")).toBe(634);
    expect(chunkedRootAddress("meow!", "woof")).not.toBe(chunkedRootAddress("meow", "woof"));
  });

  it("is sensitive to chunk order", () => {
    expect(chunkedRootAddress("meow", "woof")).not.toBe(chunkedRootAddress("woof", "meow"));
  });
});

describe("groupByAddress / uniqueBlockCount", () => {
  it("collapses cat.txt and cat-copy.txt into one group, keeps dog.txt separate", () => {
    const groups = groupByAddress(SAMPLE_FILES);
    expect(groups.size).toBe(2);
    const catGroup = groups.get(contentAddress("meow"))!;
    expect(catGroup.map((f) => f.name).sort()).toEqual(["cat-copy.txt", "cat.txt"]);
  });

  it("counts only 2 unique blocks across the 3 sample files", () => {
    expect(uniqueBlockCount(SAMPLE_FILES)).toBe(2);
  });

  it("with all-unique content, unique block count equals file count", () => {
    expect(uniqueBlockCount([{ name: "a", content: "1" }, { name: "b", content: "2" }])).toBe(2);
  });
});
