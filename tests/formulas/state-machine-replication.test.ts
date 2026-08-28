import { describe, it, expect } from "vitest";
import {
  applyCommand,
  applyLog,
  statesEqual,
  appliedPrefix,
  INITIAL_STATE,
  LOG,
  REORDERED_LOG,
} from "@/lib/math-core/state-machine-replication";

describe("applyCommand", () => {
  it("set overwrites the key", () => {
    expect(applyCommand({ x: 1 }, { op: "set", key: "x", value: 10 })).toEqual({ x: 10 });
  });

  it("add accumulates onto an existing key", () => {
    expect(applyCommand({ x: 10 }, { op: "add", key: "x", delta: 5 })).toEqual({ x: 15 });
  });

  it("add treats a missing key as 0", () => {
    expect(applyCommand({}, { op: "add", key: "y", delta: 3 })).toEqual({ y: 3 });
  });

  it("del removes the key entirely", () => {
    expect(applyCommand({ x: 10, y: 2 }, { op: "del", key: "x" })).toEqual({ y: 2 });
  });

  it("never mutates the input state", () => {
    const state = { x: 1 };
    applyCommand(state, { op: "set", key: "x", value: 99 });
    expect(state).toEqual({ x: 1 });
  });
});

describe("applyLog on the canonical LOG", () => {
  it("walks x through 10, 15, 12, 100, 101 one command at a time", () => {
    expect(appliedPrefix(LOG, 1)).toEqual({ x: 10 });
    expect(appliedPrefix(LOG, 2)).toEqual({ x: 15 });
    expect(appliedPrefix(LOG, 3)).toEqual({ x: 12 });
    expect(appliedPrefix(LOG, 4)).toEqual({ x: 100 });
    expect(appliedPrefix(LOG, 5)).toEqual({ x: 101 });
  });

  it("applying the full log twice from the same initial state gives identical results (determinism)", () => {
    const first = applyLog(INITIAL_STATE, LOG);
    const second = applyLog(INITIAL_STATE, LOG);
    expect(statesEqual(first, second)).toBe(true);
  });

  it("a lagging replica that applies the remaining suffix catches up to the same final state", () => {
    const lagging = appliedPrefix(LOG, 3); // x=12, replica fell behind here
    const caughtUp = applyLog(lagging, LOG.slice(3));
    const leader = applyLog(INITIAL_STATE, LOG);
    expect(statesEqual(caughtUp, leader)).toBe(true);
    expect(caughtUp).toEqual({ x: 101 });
  });
});

describe("REORDERED_LOG", () => {
  it("has the same commands as LOG, just reordered", () => {
    const sortKey = (c: (typeof LOG)[number]) => JSON.stringify(c);
    expect([...LOG].map(sortKey).sort()).toEqual([...REORDERED_LOG].map(sortKey).sort());
  });

  it("produces a DIFFERENT final state than LOG, because set doesn't commute with add", () => {
    const canonical = applyLog(INITIAL_STATE, LOG);
    const reordered = applyLog(INITIAL_STATE, REORDERED_LOG);
    expect(canonical).toEqual({ x: 101 });
    expect(reordered).toEqual({ x: 11 });
    expect(statesEqual(canonical, reordered)).toBe(false);
  });
});

describe("statesEqual", () => {
  it("compares by key/value, not by reference", () => {
    expect(statesEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
  });

  it("detects a differing key count", () => {
    expect(statesEqual({ x: 1 }, { x: 1, y: 2 })).toBe(false);
  });

  it("detects a differing value", () => {
    expect(statesEqual({ x: 1 }, { x: 2 })).toBe(false);
  });
});
