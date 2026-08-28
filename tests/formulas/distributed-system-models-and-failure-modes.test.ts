import { describe, it, expect } from "vitest";
import {
  MESSAGES,
  messageDelay,
  isSynchronousUnderBound,
  minimumSynchronousBound,
  classifyFailure,
  ROUND_LOGS,
} from "@/lib/math-core/distributed-system-models-and-failure-modes";

describe("message delays", () => {
  it("computes each message's exact delay", () => {
    expect(messageDelay(MESSAGES.find((m) => m.id === "m1")!)).toBe(2);
    expect(messageDelay(MESSAGES.find((m) => m.id === "m2")!)).toBe(9);
  });

  it("returns null for a message that never arrives", () => {
    expect(messageDelay({ id: "x", from: "A", to: "B", sentAt: 0, deliveredAt: null })).toBeNull();
  });
});

describe("synchrony bound", () => {
  it("the minimum bound that makes MESSAGES synchronous is 9 (m2's delay)", () => {
    expect(minimumSynchronousBound(MESSAGES)).toBe(9);
  });

  it("is synchronous under bound 9, not under bound 8", () => {
    expect(isSynchronousUnderBound(MESSAGES, 9)).toBe(true);
    expect(isSynchronousUnderBound(MESSAGES, 8)).toBe(false);
  });

  it("a dropped message means no finite bound works", () => {
    const withDrop = [...MESSAGES, { id: "m7", from: "D", to: "A", sentAt: 0, deliveredAt: null }];
    expect(minimumSynchronousBound(withDrop)).toBeNull();
    expect(isSynchronousUnderBound(withDrop, 1000)).toBe(false);
  });
});

describe("classifyFailure", () => {
  it("classifies A as correct", () => {
    expect(classifyFailure(ROUND_LOGS.find((l) => l.node === "A")!)).toBe("correct");
  });

  it("classifies B as crashed — it sent nothing", () => {
    expect(classifyFailure(ROUND_LOGS.find((l) => l.node === "B")!)).toBe("crash");
  });

  it("classifies C as omission — correct value, but D never got it", () => {
    expect(classifyFailure(ROUND_LOGS.find((l) => l.node === "C")!)).toBe("omission");
  });

  it("classifies D as Byzantine — told B a different value than everyone else", () => {
    expect(classifyFailure(ROUND_LOGS.find((l) => l.node === "D")!)).toBe("byzantine");
  });

  it("a node that lies to everyone consistently is still Byzantine, not merely wrong", () => {
    const log = { node: "X", expected: { A: 1, B: 1 }, actual: { A: 2, B: 2 } };
    expect(classifyFailure(log)).toBe("byzantine");
  });
});
