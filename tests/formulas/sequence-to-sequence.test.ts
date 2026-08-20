import { describe, it, expect } from "vitest";
import { runSeqToSeq, encoderTrace, context, decode } from "@/lib/math-core/sequence-to-sequence";

describe("sequence-to-sequence", () => {
  it("the encoder compresses a 3-token input into one final hidden state", () => {
    const trace = encoderTrace();
    expect(trace).toHaveLength(3);
    expect(trace[0]).toBeCloseTo(0.7615941559557649, 12);
    expect(trace[1]).toBeCloseTo(-0.5505728129179853, 12);
    expect(trace[2]).toBeCloseTo(0.6198205237320793, 12);
    expect(context()).toBe(trace[trace.length - 1]);
  });

  it("the same context vector unrolls into a 2-step output", () => {
    const outputs = decode(context(), 2);
    expect(outputs).toEqual([0.5510030544090346, 0.2687365519481803]);
  });

  it("the same context vector can also unroll into a longer, 4-step output", () => {
    const outputs = decode(context(), 4);
    expect(outputs).toHaveLength(4);
    expect(outputs[0]).toBeCloseTo(0.5510030544090346, 12);
    expect(outputs[3]).toBeCloseTo(0.06668359880196889, 12);
  });

  it("decoder output magnitude shrinks toward zero the longer it runs unprompted", () => {
    const outputs = decode(context(), 4);
    for (let i = 1; i < outputs.length; i++) {
      expect(Math.abs(outputs[i])).toBeLessThan(Math.abs(outputs[i - 1]));
    }
  });

  it("runSeqToSeq bundles encoder and decoder into one pipeline", () => {
    const result = runSeqToSeq();
    expect(result.context).toBe(result.encoderStates[result.encoderStates.length - 1]);
    expect(result.outputs).toEqual(decode(result.context, 2));
  });
});
