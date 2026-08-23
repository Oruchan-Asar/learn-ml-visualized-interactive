export interface Point2D {
  x: number;
  y: number;
}

/**
 * Four points, laid out on a single axis, in two tight pairs far apart from each other. PCA (a
 * *linear* projection) would preserve their actual coordinate order — pair 1 stays left of pair 2,
 * at roughly the true relative distance. t-SNE only promises to preserve *who's a neighbor of whom*,
 * so nothing here guarantees the pairs land on the correct sides of each other in the embedding, or
 * anywhere near their true separation — only that each pair stays close together.
 */
export const HIGH_DIM_POINTS: Point2D[] = [
  { x: 0, y: 0 }, // P1
  { x: 1, y: 0 }, // P2
  { x: 20, y: 0 }, // P3
  { x: 21, y: 0 }, // P4
];

export const LABELS = ["P1", "P2", "P3", "P4"];

/** Fixed Gaussian bandwidth for every point. Real t-SNE solves for a per-point sigma via a binary
 * search over the target perplexity; fixing it here keeps every number below exact and reproducible
 * with a calculator, without changing the shape of the mechanism. */
export const SIGMA = 1;

export function squaredDistance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** The conditional similarity of j to i: a Gaussian centered on i, evaluated at j, normalized over
 * every other point. */
export function conditionalP(points: Point2D[], i: number, sigma: number = SIGMA): number[] {
  const weights = points.map((p, j) => (j === i ? 0 : Math.exp(-squaredDistance(points[i], p) / (2 * sigma * sigma))));
  const total = weights.reduce((s, w) => s + w, 0);
  return weights.map((w) => w / total);
}

/** The full symmetrized affinity matrix: p_ij = (p_{j|i} + p_{i|j}) / (2n). Sums to 1 over the whole
 * matrix (excluding the diagonal). */
export function computeP(points: Point2D[], sigma: number = SIGMA): number[][] {
  const n = points.length;
  const conditional = points.map((_, i) => conditionalP(points, i, sigma));
  return conditional.map((row, i) => row.map((_, j) => (i === j ? 0 : (conditional[i][j] + conditional[j][i]) / (2 * n))));
}

/** The low-dimensional similarity: a Student-t kernel (heavier tails than a Gaussian), normalized
 * over the whole matrix. */
export function computeQ(embedding: Point2D[]): number[][] {
  const weights = embedding.map((a, i) => embedding.map((b, j) => (i === j ? 0 : 1 / (1 + squaredDistance(a, b)))));
  const total = weights.reduce((s, row) => s + row.reduce((rs, w) => rs + w, 0), 0);
  return weights.map((row) => row.map((w) => w / total));
}

/** KL divergence between P and Q — what t-SNE's optimization minimizes. */
export function klDivergence(p: number[][], q: number[][]): number {
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < p.length; j++) {
      if (i === j || p[i][j] <= 0) continue;
      sum += p[i][j] * Math.log(p[i][j] / q[i][j]);
    }
  }
  return sum;
}

/** The exact t-SNE gradient: dC/dy_i = 4 * sum_j (p_ij - q_ij) * (1+||y_i-y_j||^2)^-1 * (y_i - y_j). */
export function gradient(p: number[][], embedding: Point2D[]): Point2D[] {
  const q = computeQ(embedding);
  return embedding.map((yi, i) => {
    let gx = 0;
    let gy = 0;
    embedding.forEach((yj, j) => {
      if (i === j) return;
      const affinityDiff = p[i][j] - q[i][j];
      const studentWeight = 1 / (1 + squaredDistance(yi, yj));
      gx += affinityDiff * studentWeight * (yi.x - yj.x);
      gy += affinityDiff * studentWeight * (yi.y - yj.y);
    });
    return { x: 4 * gx, y: 4 * gy };
  });
}

/** A fixed (not random) starting layout — small, distinct offsets so no two points start identically
 * placed, breaking the symmetry that would otherwise stall the gradient. */
export const INIT_EMBEDDING: Point2D[] = [
  { x: 0.1, y: 0.05 },
  { x: -0.1, y: 0.1 },
  { x: 0.15, y: -0.05 },
  { x: -0.05, y: -0.1 },
];

export const LEARNING_RATE = 50;

export function trainStep(p: number[][], embedding: Point2D[], learningRate: number = LEARNING_RATE): Point2D[] {
  const grad = gradient(p, embedding);
  return embedding.map((y, i) => ({ x: y.x - learningRate * grad[i].x, y: y.y - learningRate * grad[i].y }));
}

export function train(p: number[][], embedding0: Point2D[], steps: number, learningRate: number = LEARNING_RATE): Point2D[] {
  let embedding = embedding0;
  for (let i = 0; i < steps; i++) embedding = trainStep(p, embedding, learningRate);
  return embedding;
}

export function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt(squaredDistance(a, b));
}
