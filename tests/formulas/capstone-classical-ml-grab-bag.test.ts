import { describe, expect, it } from "vitest";
import { knnRank, knnPrediction, naiveBayesClassify, dbscanLabels, NOISE } from "@/lib/math-core/capstone-classical-ml-grab-bag";

describe("kNN on the shared messy dataset", () => {
  it("k=1 is fooled by the noisy point and predicts A — wrong", () => {
    expect(knnPrediction(1)).toBe("A");
    expect(knnRank()[0].point.label).toBe("A");
  });

  it("k=3 correctly outvotes the noisy point and predicts B", () => {
    expect(knnPrediction(3)).toBe("B");
  });
});

describe("Naive Bayes on the same dataset, using binarized (x, y) features", () => {
  it("correctly predicts B, and isn't fooled by the noisy point at all", () => {
    const result = naiveBayesClassify();
    expect(result.prediction).toBe("B");
  });

  it("is confident, not just correct — posterior for B is above 0.85", () => {
    const result = naiveBayesClassify();
    expect(result.posteriors.B).toBeGreaterThan(0.85);
  });
});

describe("DBSCAN on the same points, using no labels at all", () => {
  it("finds exactly 2 clusters, no noise points", () => {
    const labels = dbscanLabels();
    expect(labels.every((l) => l !== NOISE)).toBe(true);
    expect(new Set(labels).size).toBe(2);
  });

  it("groups the mislabeled point with its true spatial neighbors (the B cluster), not the A cluster it's labeled as", () => {
    const labels = dbscanLabels();
    // index 4 is the noisy point; indices 5-8 are the real B cluster.
    expect(labels[4]).toBe(labels[5]);
    expect(labels[4]).not.toBe(labels[0]);
  });
});
