export interface ShardSummary {
  size: number;
  avg: number;
}

/** Six per-example gradients from one batch — the ground truth a single machine would compute directly. */
export const GRADIENTS = [4, -2, 6, 0, -8, 12];

export function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** What a single machine computes: the average gradient over the whole batch. */
export function fullBatchAverage(gradients: number[] = GRADIENTS): number {
  return average(gradients);
}

export function shardAverage(shard: number[]): number {
  return average(shard);
}

export function toShardSummaries(shards: number[][]): ShardSummary[] {
  return shards.map((s) => ({ size: s.length, avg: shardAverage(s) }));
}

/** Averaging each worker's average, unweighted — only correct when every shard is the same size. */
export function naiveAverage(shardAverages: number[]): number {
  return average(shardAverages);
}

/** Averaging each worker's average weighted by its shard size — always matches the full-batch average. */
export function weightedAverage(shards: ShardSummary[]): number {
  const totalSize = shards.reduce((sum, s) => sum + s.size, 0);
  return shards.reduce((sum, s) => sum + s.avg * s.size, 0) / totalSize;
}

/** Three equal-sized shards of GRADIENTS — the case where naive averaging happens to be correct. */
export const EQUAL_SHARDS: number[][] = [
  [4, -2],
  [6, 0],
  [-8, 12],
];

/** Two unequal-sized shards of GRADIENTS — naive averaging silently gives the wrong answer here. */
export const UNEQUAL_SHARDS: number[][] = [
  [4, -2],
  [6, 0, -8, 12],
];

/** A third, unseen partition of the same six gradients into three unequal shards, for the checkpoint. */
export const CHECKPOINT_SHARDS: number[][] = [[4], [-2], [6, 0, -8, 12]];
