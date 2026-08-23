import { describe, it, expect } from "vitest";
import {
  D_MODEL,
  STATE_SIZE,
  NUM_LAYERS,
  DEFAULT_PATTERN,
  ALL_ATTENTION,
  ALL_SSM,
  attentionLayerCost,
  ssmLayerCost,
  layerCost,
  totalCost,
  costForAttentionCount,
  SEQUENCE_LENGTHS,
  ATTENTION_COUNTS,
} from "@/lib/math-core/hybrid-transformer-ssm-architectures";

describe("attentionLayerCost", () => {
  it("matches the hand-computed value: n² × d", () => {
    expect(attentionLayerCost(64, D_MODEL)).toBe(64 * 64 * 8);
    expect(attentionLayerCost(64)).toBe(32768);
  });
});

describe("ssmLayerCost", () => {
  it("matches the hand-computed value: n × d × s", () => {
    expect(ssmLayerCost(64, D_MODEL, STATE_SIZE)).toBe(64 * 8 * 4);
    expect(ssmLayerCost(64)).toBe(2048);
  });
});

describe("layerCost", () => {
  it("dispatches to attentionLayerCost for 'attention' and ssmLayerCost for 'ssm'", () => {
    expect(layerCost("attention", 64)).toBe(attentionLayerCost(64));
    expect(layerCost("ssm", 64)).toBe(ssmLayerCost(64));
  });
});

describe("totalCost", () => {
  it("matches the hand-computed total for the all-attention stack at n = 64: 4 x 32768 = 131072", () => {
    expect(NUM_LAYERS).toBe(4);
    expect(totalCost(ALL_ATTENTION, 64)).toBe(131072);
  });

  it("matches the hand-computed total for the all-SSM stack at n = 64: 4 x 2048 = 8192", () => {
    expect(totalCost(ALL_SSM, 64)).toBe(8192);
  });

  it("matches the hand-computed total for the default 1-attention, 3-SSM hybrid at n = 64: 32768 + 3x2048 = 38912", () => {
    expect(DEFAULT_PATTERN.filter((t) => t === "attention")).toHaveLength(1);
    expect(totalCost(DEFAULT_PATTERN, 64)).toBe(38912);
  });

  it("total cost only depends on how many layers are attention, not their order", () => {
    const shuffled: typeof DEFAULT_PATTERN = ["ssm", "ssm", "attention", "ssm"];
    expect(totalCost(shuffled, 64)).toBe(totalCost(DEFAULT_PATTERN, 64));
  });
});

describe("costForAttentionCount", () => {
  it("matches totalCost for every attention count at n = 64", () => {
    for (const k of ATTENTION_COUNTS) {
      const pattern = Array.from({ length: NUM_LAYERS }, (_, i) => (i < k ? "attention" : "ssm")) as ("attention" | "ssm")[];
      expect(costForAttentionCount(k, 64)).toBe(totalCost(pattern, 64));
    }
  });

  it("increases strictly as the attention-layer count increases, at a fixed sequence length", () => {
    const costs = ATTENTION_COUNTS.map((k) => costForAttentionCount(k, 64));
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1]);
  });

  it("the all-attention total grows quadratically with n while the all-SSM total grows linearly", () => {
    const attnCosts = SEQUENCE_LENGTHS.map((n) => costForAttentionCount(NUM_LAYERS, n));
    const ssmCosts = SEQUENCE_LENGTHS.map((n) => costForAttentionCount(0, n));
    // doubling n roughly quadruples attention cost but only doubles SSM cost
    const lastTwo = SEQUENCE_LENGTHS.length - 1;
    expect(attnCosts[lastTwo] / attnCosts[lastTwo - 1]).toBeCloseTo(4, 5);
    expect(ssmCosts[lastTwo] / ssmCosts[lastTwo - 1]).toBeCloseTo(2, 5);
  });
});
