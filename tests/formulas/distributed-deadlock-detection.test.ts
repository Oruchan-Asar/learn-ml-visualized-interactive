import { describe, it, expect } from "vitest";
import { LOCAL_VIEWS, mergeWaitForGraph, findCycle, localViewHasCycle, type ProcessId } from "@/lib/math-core/distributed-deadlock-detection";

describe("no single site's local view contains the cycle", () => {
  it("none of the 3 local views has a cycle on its own", () => {
    for (const view of LOCAL_VIEWS) {
      expect(localViewHasCycle(view)).toBe(false);
    }
  });
});

describe("merging the local views into one global graph", () => {
  it("combines all edges from all 3 sites, deduplicated", () => {
    const merged = mergeWaitForGraph(LOCAL_VIEWS);
    expect(merged).toEqual([
      ["P1", "P2"],
      ["P2", "P3"],
      ["P3", "P1"],
      ["P4", "P5"],
    ]);
  });

  it("deduplicates an edge reported by two sites", () => {
    const merged = mergeWaitForGraph([...LOCAL_VIEWS, { site: "Site D", edges: [["P1", "P2"]] }]);
    expect(merged.length).toBe(4);
  });
});

describe("cycle detection on the merged graph", () => {
  it("finds the P1 -> P2 -> P3 -> P1 cycle that no single site could see", () => {
    const merged = mergeWaitForGraph(LOCAL_VIEWS);
    const cycle = findCycle(merged);
    expect(cycle).toEqual(["P1", "P2", "P3"]);
  });

  it("P4 -> P5 alone is not part of any cycle", () => {
    const cycle = findCycle([["P4", "P5"]]);
    expect(cycle).toBeNull();
  });

  it("returns null for an acyclic graph even with multiple chains", () => {
    const edges: [ProcessId, ProcessId][] = [
      ["P1", "P2"],
      ["P2", "P3"],
      ["P4", "P5"],
    ];
    expect(findCycle(edges)).toBeNull();
  });

  it("detects a direct 2-cycle (mutual wait)", () => {
    const edges: [ProcessId, ProcessId][] = [
      ["P1", "P2"],
      ["P2", "P1"],
    ];
    expect(findCycle(edges)).toEqual(["P1", "P2"]);
  });

  it("returns null for an empty graph", () => {
    expect(findCycle([])).toBeNull();
  });
});
