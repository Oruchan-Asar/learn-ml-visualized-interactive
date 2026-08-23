import { describe, it, expect } from "vitest";
import {
  PROMPT_TOKENS,
  RESPONSE_TOKENS,
  FULL_TOKENS,
  NLL,
  PROMPT_LENGTH,
  BASE_COMPLETION_TOKENS,
  SFT_COMPLETION_TOKENS,
  meanLoss,
  fullSequenceLoss,
  maskedLoss,
} from "@/lib/math-core/instruction-tuning-and-sft";

describe("token setup", () => {
  it("FULL_TOKENS is the prompt followed by the response", () => {
    expect(FULL_TOKENS).toEqual([...PROMPT_TOKENS, ...RESPONSE_TOKENS]);
    expect(PROMPT_LENGTH).toBe(3);
    expect(FULL_TOKENS).toHaveLength(8);
    expect(NLL).toHaveLength(8);
  });

  it("SFT's completion is exactly the response tokens; the base completion is a different length", () => {
    expect(SFT_COMPLETION_TOKENS).toEqual(RESPONSE_TOKENS);
    expect(BASE_COMPLETION_TOKENS).not.toEqual(RESPONSE_TOKENS);
  });
});

describe("meanLoss", () => {
  it("averages a list of NLL values", () => {
    expect(meanLoss([1, 2, 3])).toBeCloseTo(2, 10);
  });

  it("is NaN for an empty list", () => {
    expect(meanLoss([])).toBeNaN();
  });
});

describe("fullSequenceLoss", () => {
  it("matches the hand-computed mean over all 8 tokens: (2.1+1.8+0.3+1.2+0.9+1.5+0.7+0.2)/8 = 1.0875", () => {
    expect(fullSequenceLoss()).toBeCloseTo(1.0875, 10);
  });
});

describe("maskedLoss", () => {
  it("matches the hand-computed mean over just the 5 response tokens: (1.2+0.9+1.5+0.7+0.2)/5 = 0.9", () => {
    expect(maskedLoss(PROMPT_LENGTH)).toBeCloseTo(0.9, 10);
  });

  it("masking the response out (splitIndex = full length) is undefined -- mean of an empty slice", () => {
    expect(maskedLoss(FULL_TOKENS.length)).toBeNaN();
  });

  it("SFT's masked loss is lower than pretraining's full-sequence loss on this toy example", () => {
    expect(maskedLoss(PROMPT_LENGTH)).toBeLessThan(fullSequenceLoss());
  });
});
