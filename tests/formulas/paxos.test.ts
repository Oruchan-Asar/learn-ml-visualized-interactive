import { describe, it, expect } from "vitest";
import {
  ACCEPTOR_IDS,
  ROUND_1_PROMISES,
  ROUND_2_PROMISES,
  hasMajority,
  valueToPropose,
  isChosen,
} from "@/lib/math-core/paxos";

describe("hasMajority over a 3-acceptor cluster", () => {
  it("2 of 3 is a majority", () => {
    expect(hasMajority(2, ACCEPTOR_IDS.length)).toBe(true);
  });

  it("1 of 3 is not", () => {
    expect(hasMajority(1, ACCEPTOR_IDS.length)).toBe(false);
  });

  it("exactly half of an even cluster is not a majority", () => {
    expect(hasMajority(2, 4)).toBe(false);
    expect(hasMajority(3, 4)).toBe(true);
  });
});

describe("valueToPropose — round 1 (nothing previously accepted)", () => {
  it("uses the proposer's own value when every promise reports no prior accepted value", () => {
    expect(valueToPropose(ROUND_1_PROMISES, "X")).toBe("X");
  });
});

describe("valueToPropose — round 2 (safety: must adopt the already-accepted value)", () => {
  it("adopts A1's previously accepted value X instead of the new proposer's own value Y", () => {
    expect(valueToPropose(ROUND_2_PROMISES, "Y")).toBe("X");
  });

  it("picks the HIGHEST-numbered accepted value when multiple acceptors report different ones", () => {
    const promises = [
      { acceptorId: "A1", acceptedNumber: 1, acceptedValue: "X" },
      { acceptorId: "A2", acceptedNumber: 2, acceptedValue: "Z" },
      { acceptorId: "A3", acceptedNumber: null, acceptedValue: null },
    ];
    expect(valueToPropose(promises, "Y")).toBe("Z");
  });
});

describe("isChosen", () => {
  it("a value is chosen once a majority of acceptors accept it", () => {
    expect(isChosen(2, 3)).toBe(true);
    expect(isChosen(1, 3)).toBe(false);
  });

  it("matches the worked example: all 3 of 3 acceptors accepting is certainly chosen", () => {
    expect(isChosen(3, 3)).toBe(true);
  });
});
