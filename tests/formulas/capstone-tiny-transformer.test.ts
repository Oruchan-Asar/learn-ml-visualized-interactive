import { describe, it, expect } from "vitest";
import {
  VOCAB,
  EXAMPLES,
  TARGET_LOSS,
  initialParams,
  meanLoss,
  trainStep,
  trainEpochs,
  predictNext,
  generate,
  forward,
} from "@/lib/math-core/capstone-tiny-transformer";

describe("the repeating pattern is genuinely learnable but not trivial", () => {
  it("has exactly 3 distinct training examples, one per rotation of 'abc'", () => {
    expect(EXAMPLES).toHaveLength(3);
    expect(EXAMPLES.map((e) => e.target).sort()).toEqual([0, 1, 2]);
  });
});

describe("training reduces loss and eventually solves next-character prediction", () => {
  it("loss after only 1 training step has not yet reached the target", () => {
    const afterOne = trainStep(initialParams());
    expect(meanLoss(afterOne)).toBeGreaterThan(TARGET_LOSS);
  });

  it("loss after 60 epochs is below the target threshold", () => {
    const trained = trainEpochs(initialParams(), 60);
    expect(meanLoss(trained)).toBeLessThan(TARGET_LOSS);
  });

  it("loss strictly decreases from epoch 20 to 40 to 60", () => {
    const at20 = meanLoss(trainEpochs(initialParams(), 20));
    const at40 = meanLoss(trainEpochs(initialParams(), 40));
    const at60 = meanLoss(trainEpochs(initialParams(), 60));
    expect(at40).toBeLessThan(at20);
    expect(at60).toBeLessThan(at40);
  });

  it("after 60 epochs, every training example is predicted correctly", () => {
    const trained = trainEpochs(initialParams(), 60);
    for (const ex of EXAMPLES) {
      expect(predictNext(trained, ex.context)).toBe(ex.target);
    }
  });

  it("before training, the network does not already solve the task perfectly", () => {
    const fresh = initialParams();
    const allCorrect = EXAMPLES.every((ex) => predictNext(fresh, ex.context) === ex.target);
    expect(allCorrect).toBe(false);
  });
});

describe("autoregressive generation reproduces the true repeating pattern", () => {
  it("starting from 'abc', the trained model generates 'abcabcabcabc'", () => {
    const trained = trainEpochs(initialParams(), 200);
    const text = generate(trained, [0, 1, 2], 9);
    expect(text).toBe("abcabcabcabc");
  });
});

describe("forward pass produces valid probabilities", () => {
  it("probabilities sum to 1 and are all non-negative", () => {
    const params = initialParams();
    for (const ex of EXAMPLES) {
      const { probs } = forward(params, ex.context);
      expect(probs).toHaveLength(VOCAB.length);
      expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
      for (const p of probs) expect(p).toBeGreaterThanOrEqual(0);
    }
  });

  it("each position's attention weights sum to 1", () => {
    const params = initialParams();
    const { attentionWeights } = forward(params, EXAMPLES[0].context);
    for (const row of attentionWeights) {
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
  });
});
