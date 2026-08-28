import { describe, it, expect } from "vitest";
import {
  NUM_SHARDS,
  ACCOUNTS,
  assignShard,
  isCrossShard,
  totalThroughput,
  crossShardMessageCost,
  accountsByShard,
} from "@/lib/math-core/sharding-in-blockchains";

describe("assignShard", () => {
  it("matches hand-worked shard assignments for all 6 accounts", () => {
    expect(assignShard("alice")).toBe(1);
    expect(assignShard("bob")).toBe(0);
    expect(assignShard("carol")).toBe(1);
    expect(assignShard("dave")).toBe(1);
    expect(assignShard("erin")).toBe(0);
    expect(assignShard("frank")).toBe(2);
  });

  it("is deterministic", () => {
    expect(assignShard("alice")).toBe(assignShard("alice"));
  });

  it("always lands in [0, numShards)", () => {
    for (const a of ACCOUNTS) {
      const s = assignShard(a);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(NUM_SHARDS);
    }
  });
});

describe("isCrossShard", () => {
  it("is false for two accounts in the same shard", () => {
    expect(isCrossShard("alice", "carol")).toBe(false); // both shard 1
  });

  it("is true for accounts in different shards", () => {
    expect(isCrossShard("alice", "bob")).toBe(true); // shard 1 vs 0
    expect(isCrossShard("alice", "frank")).toBe(true); // shard 1 vs 2
  });
});

describe("totalThroughput", () => {
  it("scales linearly with shard count", () => {
    expect(totalThroughput(1, 10)).toBe(10);
    expect(totalThroughput(3, 10)).toBe(30);
    expect(totalThroughput(6, 10)).toBe(60);
  });
});

describe("crossShardMessageCost", () => {
  it("costs 1 message for a same-shard transaction", () => {
    expect(crossShardMessageCost("alice", "carol")).toBe(1);
  });

  it("costs 1 + relayHops for a cross-shard transaction", () => {
    expect(crossShardMessageCost("alice", "bob", 2)).toBe(3);
    expect(crossShardMessageCost("alice", "bob", 4)).toBe(5);
  });
});

describe("accountsByShard", () => {
  it("groups all 6 accounts into their assigned shards with none dropped", () => {
    const groups = accountsByShard();
    expect(groups[0].sort()).toEqual(["bob", "erin"]);
    expect(groups[1].sort()).toEqual(["alice", "carol", "dave"]);
    expect(groups[2].sort()).toEqual(["frank"]);
    expect(Object.values(groups).flat()).toHaveLength(ACCOUNTS.length);
  });
});
