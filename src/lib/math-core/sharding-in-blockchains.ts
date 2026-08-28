import { toyHash } from "./toy-hash";

/**
 * Sharding splits validators (and the state/accounts they process) across independent groups so each
 * shard only has to validate its own slice of the network's transactions — throughput scales with the
 * number of shards, at the cost of transactions that cross shard boundaries needing extra coordination.
 */
export const NUM_SHARDS = 3;

/** The 6 toy accounts used throughout this chapter's diagram, worked example, and checkpoint. */
export const ACCOUNTS: string[] = ["alice", "bob", "carol", "dave", "erin", "frank"];

/** Deterministically assigns any account (or validator) id to a shard — the same rule everyone in the network applies. */
export function assignShard(id: string, numShards: number = NUM_SHARDS): number {
  return toyHash(id) % numShards;
}

/** A transaction is cross-shard exactly when its two accounts land in different shards. */
export function isCrossShard(from: string, to: string, numShards: number = NUM_SHARDS): boolean {
  return assignShard(from, numShards) !== assignShard(to, numShards);
}

/**
 * Throughput scales linearly with shard count, since shards process transactions in parallel — this is
 * the entire point of sharding. `perShardTps` is each individual shard's own transaction-per-second
 * capacity, unchanged by how many other shards exist.
 */
export function totalThroughput(numShards: number, perShardTps: number): number {
  return numShards * perShardTps;
}

/**
 * A cross-shard transaction needs a receipt relayed from the source shard to the destination shard (and
 * an acknowledgment back) before it's final — `relayHops` extra messages compared to a single-shard
 * transaction, which settles in one round with no relay at all.
 */
export function crossShardMessageCost(from: string, to: string, relayHops: number = 2, numShards: number = NUM_SHARDS): number {
  return isCrossShard(from, to, numShards) ? 1 + relayHops : 1;
}

/** Groups every account by its assigned shard — exactly what the diagram renders as clustered nodes. */
export function accountsByShard(accounts: string[] = ACCOUNTS, numShards: number = NUM_SHARDS): Record<number, string[]> {
  const groups: Record<number, string[]> = {};
  for (let s = 0; s < numShards; s++) groups[s] = [];
  for (const acct of accounts) groups[assignShard(acct, numShards)].push(acct);
  return groups;
}
