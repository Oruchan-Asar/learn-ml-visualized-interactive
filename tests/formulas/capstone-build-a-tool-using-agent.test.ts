import { describe, it, expect } from "vitest";
import { contextWindowAt, retrieveHotelCost, convertToUSD, runAgent, SCENARIOS, QUERY_INDEX } from "@/lib/math-core/capstone-build-a-tool-using-agent";

describe("contextWindowAt", () => {
  it("the hotel fact (message 0) is outside the window by the time the question is asked", () => {
    const window = contextWindowAt(QUERY_INDEX);
    expect(window.some((m) => m.id === 0)).toBe(false);
  });
});

describe("retrieveHotelCost", () => {
  it("finds the hotel cost even though it's outside the context window", () => {
    expect(retrieveHotelCost()).toBe(360);
  });

  it("throws if no fact exists before the given index", () => {
    expect(() => retrieveHotelCost(0)).toThrow();
  });
});

describe("convertToUSD", () => {
  it("multiplies exactly, no rounding", () => {
    expect(convertToUSD(200, 1.1)).toBeCloseTo(220, 10);
  });
});

describe("runAgent", () => {
  it("matches the hand-computed total for trip A", () => {
    const { total, steps } = runAgent(SCENARIOS[0]);
    expect(total).toBeCloseTo(580, 10);
    expect(steps).toHaveLength(3);
    expect(steps[2].task).toBe("compute_total");
  });

  it("matches the hand-computed totals for all three scenarios", () => {
    expect(runAgent(SCENARIOS[0]).total).toBeCloseTo(580, 8);
    expect(runAgent(SCENARIOS[1]).total).toBeCloseTo(630, 8);
    expect(runAgent(SCENARIOS[2]).total).toBeCloseTo(507, 8);
  });

  it("the retrieve and convert steps don't depend on each other's results", () => {
    const { steps } = runAgent(SCENARIOS[0]);
    expect(steps[0].task).toBe("retrieve_hotel_cost");
    expect(steps[1].task).toBe("convert_flight_price");
    // neither step's detail references the other step's result
    expect(steps[0].detail).not.toContain(steps[1].result.toFixed(2));
    expect(steps[1].detail).not.toContain(String(steps[0].result));
  });
});

describe("checkpoint fact: exactly one scenario's total exceeds $600", () => {
  it("only trip B exceeds 600", () => {
    const overThreshold = SCENARIOS.filter((s) => runAgent(s).total > 600);
    expect(overThreshold.map((s) => s.label)).toEqual(["trip B"]);
  });
});
