import { describe, it, expect } from "vitest";
import { keywordFilter, jailbreakSucceeded, REQUESTS } from "@/lib/math-core/jailbreaks-and-red-teaming";

describe("keywordFilter", () => {
  it("blocks the direct request containing a trigger phrase", () => {
    expect(keywordFilter(REQUESTS[0].text)).toBe(true);
  });

  it("lets the unrelated safe request through", () => {
    expect(keywordFilter(REQUESTS[1].text)).toBe(false);
  });

  it("lets the indirect request through, even though it asks for the same thing", () => {
    expect(keywordFilter(REQUESTS[2].text)).toBe(false);
  });

  it("blocks a second direct phrasing containing the other trigger phrase", () => {
    expect(keywordFilter(REQUESTS[3].text)).toBe(true);
  });
});

describe("jailbreakSucceeded", () => {
  it("is false for the direct request — it's restricted, but the filter correctly caught it", () => {
    expect(jailbreakSucceeded(REQUESTS[0])).toBe(false);
  });

  it("is false for the unrelated safe request — not restricted, so there's nothing to bypass", () => {
    expect(jailbreakSucceeded(REQUESTS[1])).toBe(false);
  });

  it("is true for the indirect request — restricted intent, and the filter missed it", () => {
    expect(jailbreakSucceeded(REQUESTS[2])).toBe(true);
  });

  it("is false for the second direct phrasing — restricted, and correctly caught", () => {
    expect(jailbreakSucceeded(REQUESTS[3])).toBe(false);
  });

  it("exactly one of the four requests is a successful jailbreak", () => {
    const successes = REQUESTS.filter(jailbreakSucceeded);
    expect(successes).toHaveLength(1);
    expect(successes[0]).toBe(REQUESTS[2]);
  });
});
