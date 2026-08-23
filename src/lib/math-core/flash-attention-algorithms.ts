/**
 * Softmax attention normalizes each query's row by the sum of every score in that row, which seems to
 * force the entire n×n score matrix to exist in memory before any output can be produced. FlashAttention
 * shows this isn't true: process the keys and values in small blocks, keep a running max and running sum
 * per query (the "online softmax" trick), rescale what's already been accumulated whenever a new block
 * raises the running max, and the final output is mathematically *identical* to the naive computation —
 * without ever materializing more than one block's worth of scores at a time.
 */
export const N = 4; // sequence length
export const D = 2; // head dimension
export const BLOCK = 2; // tile size: rows/cols per block
export const NUM_BLOCKS = N / BLOCK;

export const Q: number[][] = [
  [1, 1],
  [1, 0],
  [0, 1],
  [1, -1],
];
export const K: number[][] = [
  [1, 0],
  [0, 1],
  [1, 0],
  [0, 1],
];
export const V: number[][] = [
  [1, 0],
  [3, 1],
  [5, -1],
  [0, 4],
];

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

/** The full n×n matrix of raw (pre-softmax) attention scores — what naive attention must hold all at once. */
export function scoreMatrix(q: number[][] = Q, k: number[][] = K): number[][] {
  return q.map((qi) => k.map((kj) => dot(qi, kj)));
}

/** The textbook definition: build the full score matrix, softmax each row, then weight-sum the values. */
export function naiveAttention(q: number[][] = Q, k: number[][] = K, v: number[][] = V): number[][] {
  const scores = scoreMatrix(q, k);
  return scores.map((row) => {
    const max = Math.max(...row);
    const exps = row.map((s) => Math.exp(s - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    const weights = exps.map((e) => e / sum);
    const out = new Array(v[0].length).fill(0);
    for (let j = 0; j < row.length; j++) {
      for (let d = 0; d < out.length; d++) out[d] += weights[j] * v[j][d];
    }
    return out;
  });
}

/**
 * FlashAttention's online-softmax recurrence: sweep the keys/values in blocks, keeping a running max (m),
 * running sum (l), and running weighted-value accumulator (acc) per query. Every time a new block raises
 * the running max, everything accumulated so far gets rescaled by exp(oldMax - newMax) so it's still
 * correctly normalized against the new max — no block ever needs to see any other block's scores.
 */
export function flashAttention(q: number[][] = Q, k: number[][] = K, v: number[][] = V, block: number = BLOCK): number[][] {
  const d = v[0].length;
  return q.map((qi) => {
    let m = -Infinity;
    let l = 0;
    let acc = new Array(d).fill(0);
    for (let b0 = 0; b0 < k.length; b0 += block) {
      const b1 = Math.min(k.length, b0 + block);
      const blockScores: number[] = [];
      for (let j = b0; j < b1; j++) blockScores.push(dot(qi, k[j]));
      const blockMax = Math.max(...blockScores);
      const newM = Math.max(m, blockMax);
      const scaleOld = m === -Infinity ? 0 : Math.exp(m - newM);
      l *= scaleOld;
      acc = acc.map((a) => a * scaleOld);
      for (let jj = 0; jj < blockScores.length; jj++) {
        const j = b0 + jj;
        const p = Math.exp(blockScores[jj] - newM);
        l += p;
        for (let d2 = 0; d2 < d; d2++) acc[d2] += p * v[j][d2];
      }
      m = newM;
    }
    return acc.map((a) => a / l);
  });
}

export interface Tile {
  qBlock: number;
  kBlock: number;
  rows: [number, number];
  cols: [number, number];
  scores: number[][];
}

/** Processing order of (query-block, key-block) tiles: all key-blocks for query-block 0, then all for query-block 1, etc. */
export const TILE_ORDER: { qBlock: number; kBlock: number }[] = (() => {
  const order: { qBlock: number; kBlock: number }[] = [];
  for (let qb = 0; qb < NUM_BLOCKS; qb++) {
    for (let kb = 0; kb < NUM_BLOCKS; kb++) order.push({ qBlock: qb, kBlock: kb });
  }
  return order;
})();

export const NUM_STEPS = TILE_ORDER.length;

/** The tile (submatrix of scores) touched at a given trace step — never more than block×block numbers at once. */
export function tileAt(step: number, q: number[][] = Q, k: number[][] = K): Tile {
  const { qBlock, kBlock } = TILE_ORDER[step];
  const rows: [number, number] = [qBlock * BLOCK, qBlock * BLOCK + BLOCK - 1];
  const cols: [number, number] = [kBlock * BLOCK, kBlock * BLOCK + BLOCK - 1];
  const full = scoreMatrix(q, k);
  const scores = full.slice(rows[0], rows[1] + 1).map((row) => row.slice(cols[0], cols[1] + 1));
  return { qBlock, kBlock, rows, cols, scores };
}

export const SEQUENCE_LENGTHS = [4, 8, 16, 32, 64, 128];

/** Naive attention's peak memory: it must hold the entire n×n score matrix simultaneously. */
export function naivePeakMemory(n: number): number {
  return n * n;
}

/** Tiled attention's peak memory: only ever one block×block tile of scores at a time, however large n grows. */
export function tiledPeakMemory(block: number = BLOCK): number {
  return block * block;
}
