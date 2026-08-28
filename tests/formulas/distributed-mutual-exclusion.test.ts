import { describe, it, expect } from "vitest";
import {
  hasPriority,
  shouldReplyImmediately,
  REQUESTS,
  determineEntryOrder,
  replyMatrix,
  RING,
  nextTokenHolder,
} from "@/lib/math-core/distributed-mutual-exclusion";

describe("hasPriority", () => {
  it("a lower timestamp always has priority", () => {
    expect(hasPriority({ nodeId: "Q", timestamp: 3 }, { nodeId: "P", timestamp: 5 })).toBe(true);
    expect(hasPriority({ nodeId: "P", timestamp: 5 }, { nodeId: "Q", timestamp: 3 })).toBe(false);
  });

  it("ties are broken by the lower node id", () => {
    expect(hasPriority({ nodeId: "Q", timestamp: 3 }, { nodeId: "R", timestamp: 3 })).toBe(true);
    expect(hasPriority({ nodeId: "R", timestamp: 3 }, { nodeId: "Q", timestamp: 3 })).toBe(false);
  });
});

describe("shouldReplyImmediately", () => {
  it("a node in the CS never replies immediately", () => {
    expect(shouldReplyImmediately("in-cs", { nodeId: "P", timestamp: 1 }, { nodeId: "Q", timestamp: 99 })).toBe(false);
  });

  it("an idle node always replies immediately", () => {
    expect(shouldReplyImmediately("idle", null, { nodeId: "Q", timestamp: 1 })).toBe(true);
  });

  it("a requesting node defers only if its own request has priority", () => {
    const mine = { nodeId: "P", timestamp: 5 };
    expect(shouldReplyImmediately("requesting", mine, { nodeId: "Q", timestamp: 3 })).toBe(true); // P has no priority over Q
    expect(shouldReplyImmediately("requesting", { nodeId: "Q", timestamp: 3 }, { nodeId: "P", timestamp: 5 })).toBe(false); // Q has priority over P
  });
});

describe("determineEntryOrder", () => {
  it("Q enters first (ts 3, wins tie), then R (ts 3), then P (ts 5)", () => {
    expect(determineEntryOrder(REQUESTS)).toEqual(["Q", "R", "P"]);
  });
});

describe("replyMatrix", () => {
  it("matches the hand-derived reply matrix for REQUESTS", () => {
    expect(replyMatrix(REQUESTS)).toEqual({
      P: { Q: true, R: true },
      Q: { P: false, R: false },
      R: { P: false, Q: true },
    });
  });

  it("every node that replies immediately to everyone is the one with no priority claim (P)", () => {
    const matrix = replyMatrix(REQUESTS);
    expect(Object.values(matrix.P).every(Boolean)).toBe(true);
  });
});

describe("token ring", () => {
  it("passes the token around the fixed 4-node ring in order", () => {
    expect(nextTokenHolder(RING, "P")).toBe("Q");
    expect(nextTokenHolder(RING, "Q")).toBe("R");
    expect(nextTokenHolder(RING, "R")).toBe("S");
  });

  it("wraps back to the first node after the last", () => {
    expect(nextTokenHolder(RING, "S")).toBe("P");
  });
});
