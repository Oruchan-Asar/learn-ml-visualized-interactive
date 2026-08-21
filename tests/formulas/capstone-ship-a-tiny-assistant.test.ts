import { describe, it, expect } from "vitest";
import { runAssistant, fineTuneBackbone, planServing } from "@/lib/math-core/capstone-ship-a-tiny-assistant";

describe("capstone-ship-a-tiny-assistant", () => {
  it("the LoRA-adapted backbone matches its target update to near machine precision", () => {
    const backbone = fineTuneBackbone();
    expect(backbone.loss).toBeLessThan(1e-20);
  });

  it("the same fine-tuned backbone, prompted with 'double', answers around double the query", () => {
    const result = runAssistant("double", 50, 100);
    expect(result.backboneMatchesTarget).toBe(true);
    expect(result.answer).toBeCloseTo(4.53391278950911, 10);
  });

  it("the same fine-tuned backbone, prompted with 'negate' instead, answers around the negated query", () => {
    const result = runAssistant("negate", 50, 100);
    expect(result.backboneMatchesTarget).toBe(true);
    expect(result.answer).toBeCloseTo(-2.266956394754555, 10);
  });

  it("serving 50 requests of 100 tokens each costs 50.5x less work with a KV cache", () => {
    const plan = planServing(50, 100);
    expect(plan.totalWorkWithoutCache).toBe(252500);
    expect(plan.totalWorkWithCache).toBe(5000);
    expect(plan.speedup).toBe(50.5);
  });

  it("swapping only the system prompt changes the answer without touching the fine-tuned backbone at all", () => {
    const double = runAssistant("double", 50, 100);
    const negate = runAssistant("negate", 50, 100);
    expect(double.backboneLoss).toBe(negate.backboneLoss);
    expect(double.answer).not.toBeCloseTo(negate.answer, 1);
  });
});
