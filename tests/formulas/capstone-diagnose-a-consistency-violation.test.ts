import { describe, it, expect } from "vitest";
import {
  TRACE,
  isTraceLinearizable,
  diagnoseViolation,
  isViolationMerelyConcurrent,
  findCausallyPriorWrite,
  findRealTimePriorWrite,
} from "@/lib/math-core/capstone-diagnose-a-consistency-violation";

describe("the fixed 3-replica TRACE", () => {
  it("has 5 ops across 3 clients", () => {
    expect(TRACE.length).toBe(5);
    expect(new Set(TRACE.map((o) => o.client)).size).toBe(3);
  });
});

describe("diagnosis", () => {
  it("TRACE is not linearizable", () => {
    expect(isTraceLinearizable(TRACE)).toBe(false);
  });

  it("diagnoseViolation identifies op5 as the culprit", () => {
    expect(diagnoseViolation(TRACE)?.id).toBe("op5");
  });

  it("removing the diagnosed op restores linearizability", () => {
    const violator = diagnoseViolation(TRACE)!;
    const without = TRACE.filter((o) => o.id !== violator.id);
    expect(isTraceLinearizable(without)).toBe(true);
  });
});

describe("the causality angle", () => {
  it("the write op5 should have seen (op3) is only concurrent with it, not causally before it", () => {
    const violator = diagnoseViolation(TRACE)!;
    const realTimePrior = findRealTimePriorWrite(TRACE, violator);
    expect(realTimePrior?.id).toBe("op3");
    expect(isViolationMerelyConcurrent(violator, realTimePrior!)).toBe(true);
  });

  it("op5 is only causally aware of op1 (the write it actually read from)", () => {
    const violator = diagnoseViolation(TRACE)!;
    const causalPrior = findCausallyPriorWrite(TRACE, violator);
    expect(causalPrior?.id).toBe("op1");
  });

  it("findRealTimePriorWrite returns null when no write finished before the given op started", () => {
    const first = TRACE[0];
    expect(findRealTimePriorWrite(TRACE, first)).toBeNull();
  });
});
