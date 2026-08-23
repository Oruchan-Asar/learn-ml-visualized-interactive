/**
 * A KV-cache holds one slot per token per sequence. The naive way to manage it is a per-sequence
 * contiguous block reserved up front for the worst-case length — simple, but every sequence shorter than
 * the worst case wastes the unused tail of its own block (internal fragmentation). PagedAttention manages
 * the same cache the way an OS manages memory: fixed-size pages, allocated to a sequence only as it grows.
 * The only waste left is inside a sequence's *last* page. This toy cache is small enough to lay out and
 * count by hand under both schemes.
 */

/** Total cache capacity, laid out as a 4x4 grid of slots. */
export const CACHE_ROWS = 4;
export const CACHE_COLS = 4;
export const CACHE_CAPACITY = CACHE_ROWS * CACHE_COLS;

/** Fixed per-sequence reservation under the naive (contiguous, worst-case) scheme. */
export const NAIVE_RESERVATION = 4;

/** Page size (tokens per page) under PagedAttention. */
export const PAGE_SIZE = 2;

/** Three concurrent sequences and how many tokens each has actually generated so far. */
export const SEQUENCE_LENGTHS = [1, 4, 2];

export function totalUsedTokens(lengths: number[] = SEQUENCE_LENGTHS): number {
  return lengths.reduce((a, b) => a + b, 0);
}

/** Naive scheme: every sequence reserves NAIVE_RESERVATION slots regardless of how many it uses. */
export function naiveSlotsUsed(_length: number): number {
  return NAIVE_RESERVATION;
}

/** Paged scheme: a sequence only takes as many whole pages as it needs. */
export function pagedSlotsUsed(length: number, pageSize: number = PAGE_SIZE): number {
  return Math.ceil(length / pageSize) * pageSize;
}

export function naiveTotalAllocated(lengths: number[] = SEQUENCE_LENGTHS): number {
  return lengths.reduce((sum, l) => sum + naiveSlotsUsed(l), 0);
}

export function pagedTotalAllocated(lengths: number[] = SEQUENCE_LENGTHS, pageSize: number = PAGE_SIZE): number {
  return lengths.reduce((sum, l) => sum + pagedSlotsUsed(l, pageSize), 0);
}

export function wastedSlots(allocated: number, used: number): number {
  return allocated - used;
}

export function fragmentationFraction(allocated: number, used: number): number {
  return allocated === 0 ? 0 : wastedSlots(allocated, used) / allocated;
}

export type CellStatus = { seq: number | null; status: "used" | "wasted" | "free" };

/** Lays out the naive scheme as CACHE_CAPACITY cells: each sequence's fixed block, then free cells. */
export function naiveGrid(lengths: number[] = SEQUENCE_LENGTHS): CellStatus[] {
  const cells: CellStatus[] = [];
  lengths.forEach((len, i) => {
    for (let s = 0; s < NAIVE_RESERVATION; s++) {
      cells.push({ seq: i, status: s < len ? "used" : "wasted" });
    }
  });
  while (cells.length < CACHE_CAPACITY) cells.push({ seq: null, status: "free" });
  return cells;
}

/** Lays out the paged scheme: each sequence's allocated pages, then free cells. */
export function pagedGrid(lengths: number[] = SEQUENCE_LENGTHS, pageSize: number = PAGE_SIZE): CellStatus[] {
  const cells: CellStatus[] = [];
  lengths.forEach((len, i) => {
    const allocated = pagedSlotsUsed(len, pageSize);
    for (let s = 0; s < allocated; s++) {
      cells.push({ seq: i, status: s < len ? "used" : "wasted" });
    }
  });
  while (cells.length < CACHE_CAPACITY) cells.push({ seq: null, status: "free" });
  return cells;
}

/** Unseen checkpoint scenario: two new sequences under the paged scheme. */
export const CHECKPOINT_LENGTHS = [3, 1];
export const CHECKPOINT_CANDIDATES = [1, 2, 3, 4];
