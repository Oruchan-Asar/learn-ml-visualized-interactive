import { describe, it, expect } from "vitest";
import {
  resolveDuringPartition,
  STALE_PARTITION_SCENARIO,
  pacelcLabel,
  SYSTEM_PROFILES,
  systemLabel,
} from "@/lib/math-core/the-cap-theorem-and-pacelc";

describe("resolveDuringPartition", () => {
  it("CP refuses to respond rather than risk staleness", () => {
    const result = resolveDuringPartition(STALE_PARTITION_SCENARIO, "CP");
    expect(result).toEqual({ responds: false, value: null, consistent: true });
  });

  it("AP responds immediately with whatever it has locally, even if stale", () => {
    const result = resolveDuringPartition(STALE_PARTITION_SCENARIO, "AP");
    expect(result).toEqual({ responds: true, value: 1, consistent: false });
  });

  it("AP's answer is marked consistent when the local replica does hold the latest write", () => {
    const fresh = { requestingReplica: "R1", localValue: 7, hasLatestWrite: true };
    expect(resolveDuringPartition(fresh, "AP")).toEqual({ responds: true, value: 7, consistent: true });
  });
});

describe("pacelcLabel", () => {
  it("produces all 4 canonical labels", () => {
    expect(pacelcLabel(true, true)).toBe("PC/EC");
    expect(pacelcLabel(true, false)).toBe("PC/EL");
    expect(pacelcLabel(false, true)).toBe("PA/EC");
    expect(pacelcLabel(false, false)).toBe("PA/EL");
  });
});

describe("system profiles", () => {
  it("labels Dynamo/Cassandra-style systems PA/EL", () => {
    const dynamo = SYSTEM_PROFILES.find((p) => p.name.startsWith("DynamoDB"))!;
    expect(systemLabel(dynamo)).toBe("PA/EL");
  });

  it("labels a majority-write MongoDB PC/EL", () => {
    const mongo = SYSTEM_PROFILES.find((p) => p.name.startsWith("MongoDB"))!;
    expect(systemLabel(mongo)).toBe("PC/EL");
  });

  it("labels a fully-synchronous SQL cluster PC/EC", () => {
    const sql = SYSTEM_PROFILES.find((p) => p.name.includes("SQL"))!;
    expect(systemLabel(sql)).toBe("PC/EC");
  });
});
