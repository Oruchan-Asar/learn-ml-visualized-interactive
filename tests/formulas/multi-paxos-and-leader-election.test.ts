import { describe, it, expect } from "vitest";
import {
  plainPaxosMessages,
  multiPaxosMessages,
  messagesSaved,
  multiPaxosMessagesWithLeaderChanges,
} from "@/lib/math-core/multi-paxos-and-leader-election";

describe("plainPaxosMessages", () => {
  it("costs 4 messages per decision, with no leader-reuse discount", () => {
    expect(plainPaxosMessages(1)).toBe(4);
    expect(plainPaxosMessages(5)).toBe(20);
  });

  it("is 0 for 0 decisions", () => {
    expect(plainPaxosMessages(0)).toBe(0);
  });
});

describe("multiPaxosMessages", () => {
  it("matches the worked example: 5 decisions under a stable leader cost 12 messages", () => {
    expect(multiPaxosMessages(5)).toBe(12);
  });

  it("the first decision still pays the full 4-message Phase 1 + Phase 2 cost", () => {
    expect(multiPaxosMessages(1)).toBe(4);
  });

  it("each additional decision after the first costs exactly 2 more", () => {
    expect(multiPaxosMessages(2) - multiPaxosMessages(1)).toBe(2);
    expect(multiPaxosMessages(6) - multiPaxosMessages(5)).toBe(2);
  });

  it("is 0 for 0 decisions", () => {
    expect(multiPaxosMessages(0)).toBe(0);
  });
});

describe("messagesSaved", () => {
  it("matches the worked example: 5 decisions save exactly 8 messages", () => {
    expect(messagesSaved(5)).toBe(8);
  });

  it("is 0 for a single decision — no leader reuse to benefit from yet", () => {
    expect(messagesSaved(1)).toBe(0);
  });

  it("grows by 2 for every additional decision", () => {
    expect(messagesSaved(6) - messagesSaved(5)).toBe(2);
  });
});

describe("multiPaxosMessagesWithLeaderChanges", () => {
  it("with zero leader changes, matches plain multiPaxosMessages", () => {
    expect(multiPaxosMessagesWithLeaderChanges(5, 0)).toBe(multiPaxosMessages(5));
  });

  it("each leader change adds exactly 2 extra messages (a re-paid Phase 1)", () => {
    expect(multiPaxosMessagesWithLeaderChanges(5, 1)).toBe(multiPaxosMessages(5) + 2);
    expect(multiPaxosMessagesWithLeaderChanges(5, 2)).toBe(multiPaxosMessages(5) + 4);
  });
});
