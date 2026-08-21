import { describe, it, expect } from "vitest";
import {
  regressionResults,
  passesFullSuite,
  ORIGINAL_TRIGGERS,
  BROAD_PATCH_TRIGGERS,
  SCOPED_PATCH_TRIGGERS,
  REGRESSION_SUITE,
} from "@/lib/math-core/capstone-red-team-and-patch-a-model";

describe("the original filter", () => {
  it("fails exactly one request in the suite: the jailbreak", () => {
    const results = regressionResults(ORIGINAL_TRIGGERS);
    const failures = results.filter((r) => !r.correct);
    expect(failures).toHaveLength(1);
    expect(failures[0].request.label).toBe("jailbreak (historian framing)");
  });

  it("does not pass the full suite", () => {
    expect(passesFullSuite(ORIGINAL_TRIGGERS)).toBe(false);
  });
});

describe("the broad patch", () => {
  it("catches the jailbreak, but breaks the unrelated condiment question", () => {
    const results = regressionResults(BROAD_PATCH_TRIGGERS);
    const jailbreak = results.find((r) => r.request.label === "jailbreak (historian framing)")!;
    const condimentQuestion = results.find((r) => r.request.label === "condiment question (safe)")!;
    expect(jailbreak.correct).toBe(true);
    expect(condimentQuestion.correct).toBe(false);
  });

  it("does not pass the full suite — the patch introduced a new failure", () => {
    expect(passesFullSuite(BROAD_PATCH_TRIGGERS)).toBe(false);
  });
});

describe("the scoped patch", () => {
  it("catches the jailbreak and leaves every safe request alone", () => {
    const results = regressionResults(SCOPED_PATCH_TRIGGERS);
    expect(results.every((r) => r.correct)).toBe(true);
  });

  it("is the only one of the three filter versions that passes the full suite", () => {
    expect(passesFullSuite(ORIGINAL_TRIGGERS)).toBe(false);
    expect(passesFullSuite(BROAD_PATCH_TRIGGERS)).toBe(false);
    expect(passesFullSuite(SCOPED_PATCH_TRIGGERS)).toBe(true);
  });
});

describe("REGRESSION_SUITE", () => {
  it("has 4 requests: 2 restricted, 2 safe", () => {
    expect(REGRESSION_SUITE).toHaveLength(4);
    expect(REGRESSION_SUITE.filter((r) => r.isRestrictedIntent)).toHaveLength(2);
    expect(REGRESSION_SUITE.filter((r) => !r.isRestrictedIntent)).toHaveLength(2);
  });
});
