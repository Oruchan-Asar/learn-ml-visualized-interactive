import { describe, it, expect } from "vitest";
import { runReAct, LANDMARKS } from "@/lib/math-core/react-reasoning-and-acting";

describe("runReAct", () => {
  it("corrects the naive guess for the Eiffel Tower and lands on Paris", () => {
    const trace = runReAct("Eiffel Tower");
    expect(trace.naiveAnswer).toBe("Berlin");
    expect(trace.observation1).toBe("France");
    expect(trace.finalAnswer).toBe("Paris");
    expect(trace.corrected).toBe(true);
  });

  it("corrects the naive guess for the Colosseum and lands on Rome", () => {
    const trace = runReAct("Colosseum");
    expect(trace.naiveAnswer).toBe("Athens");
    expect(trace.observation1).toBe("Italy");
    expect(trace.finalAnswer).toBe("Rome");
    expect(trace.corrected).toBe(true);
  });

  it("corrects the naive guess for the Statue of Liberty and lands on Washington, D.C.", () => {
    const trace = runReAct("Statue of Liberty");
    expect(trace.naiveAnswer).toBe("Paris");
    expect(trace.observation1).toBe("USA");
    expect(trace.finalAnswer).toBe("Washington, D.C.");
    expect(trace.corrected).toBe(true);
  });

  it("every landmark in this chapter actually requires a correction", () => {
    for (const landmark of LANDMARKS) {
      expect(runReAct(landmark).corrected).toBe(true);
    }
  });

  it("the final answer always differs from the naive answer when a correction occurred", () => {
    for (const landmark of LANDMARKS) {
      const trace = runReAct(landmark);
      if (trace.corrected) expect(trace.finalAnswer).not.toBe(trace.naiveAnswer);
    }
  });

  it("exactly one landmark's final answer is Rome", () => {
    const finals = LANDMARKS.map((l) => runReAct(l).finalAnswer);
    expect(finals.filter((f) => f === "Rome")).toHaveLength(1);
    expect(LANDMARKS[finals.indexOf("Rome")]).toBe("Colosseum");
  });
});
