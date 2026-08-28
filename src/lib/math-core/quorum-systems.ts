/**
 * Quorum systems: instead of routing every read and write through a single
 * primary, replicate to N nodes and require a write to succeed on W of them,
 * a read to be answered by R of them. As long as every possible read quorum
 * and every possible write quorum are forced to share at least one node,
 * a read can never miss the most recent write — that's the R + W > N rule.
 */

/** The cluster size used throughout this chapter's examples. */
export const CLUSTER_SIZE = 5;

/**
 * How many nodes any read quorum of size R and write quorum of size W out of
 * N are guaranteed to share, in the worst case. Positive means overlap is
 * guaranteed; zero or negative means it's possible to pick quorums that miss
 * each other entirely.
 */
export function overlapMargin(n: number, r: number, w: number): number {
  return r + w - n;
}

/** Whether every possible R-quorum and every possible W-quorum out of N are forced to overlap. */
export function quorumsOverlap(n: number, r: number, w: number): boolean {
  return overlapMargin(n, r, w) > 0;
}

/** The smallest write quorum that still guarantees overlap with a read quorum of size R out of N. */
export function minWriteQuorumFor(n: number, r: number): number {
  return n - r + 1;
}

/** A quorum size only makes sense between 1 and N nodes. */
export function isValidQuorumSize(n: number, q: number): boolean {
  return Number.isInteger(q) && q >= 1 && q <= n;
}
