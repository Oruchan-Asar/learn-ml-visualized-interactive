/** A ratings matrix indexed by position, not name — `null` marks a rating that was never observed
 * (the thing this chapter predicts). Generic over any number of users/items so the same functions
 * power both this chapter's 3x3 worked example and the capstone's larger customer/product matrix. */
export type RatingsMatrix = (number | null)[][];

export const USERS = ["U1", "U2", "U3"] as const;
export const ITEMS = ["I1", "I2", "I3"] as const;

/**
 * A 3x3 ratings matrix with one entry deliberately missing (U2's rating of I2). Two clear, opposite
 * taste groups: U1 & U2 like I1/I2 and dislike I3; U3 is the mirror image. That structure is
 * genuinely rank-2, not rank-1 — a fact this chapter's tests verify rather than assume.
 */
export const RATINGS: RatingsMatrix = [
  [5, 4, 1],
  [4, null, 1], // I2 deliberately missing
  [1, 1, 5],
];

export const MISSING = { user: 1, item: 1 };

export interface Factors {
  u: number[][];
  v: number[][];
}

/**
 * A fixed (not random) starting point. Every dimension starts near 0.5, but with a small
 * deterministic offset that varies by both entity index and dimension index — breaking the symmetry
 * that would otherwise make every extra latent dimension a duplicate of the first, forever (exactly
 * the same failure mode as Part III's identical-weight-initialization problem, one level up).
 */
export function initFactors(numUsers: number, numItems: number, k: number): Factors {
  const initFor = (n: number) => Array.from({ length: n }, (_, ei) => Array.from({ length: k }, (_, d) => 0.5 + 0.05 * (ei - d)));
  return { u: initFor(numUsers), v: initFor(numItems) };
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

export function predict(factors: Factors, userIdx: number, itemIdx: number): number {
  return dot(factors.u[userIdx], factors.v[itemIdx]);
}

export interface ObservedEntry {
  user: number;
  item: number;
  rating: number;
}

export function observedEntries(ratings: RatingsMatrix): ObservedEntry[] {
  const entries: ObservedEntry[] = [];
  ratings.forEach((row, user) => row.forEach((rating, item) => {
    if (rating !== null) entries.push({ user, item, rating });
  }));
  return entries;
}

export const LEARNING_RATE = 0.05;
export const NUM_STEPS = 2000;

/** One batch gradient descent step across every latent dimension at once — a missing entry never
 * contributes a gradient anywhere, because it's never observed. */
export function trainStep(factors: Factors, ratings: RatingsMatrix, learningRate: number = LEARNING_RATE): Factors {
  const k = factors.u[0].length;
  const uGrad = factors.u.map(() => new Array(k).fill(0));
  const vGrad = factors.v.map(() => new Array(k).fill(0));

  for (const { user, item, rating } of observedEntries(ratings)) {
    const err = rating - predict(factors, user, item);
    for (let d = 0; d < k; d++) {
      uGrad[user][d] += -2 * err * factors.v[item][d];
      vGrad[item][d] += -2 * err * factors.u[user][d];
    }
  }

  return {
    u: factors.u.map((row, i) => row.map((val, d) => val - learningRate * uGrad[i][d])),
    v: factors.v.map((row, j) => row.map((val, d) => val - learningRate * vGrad[j][d])),
  };
}

export function train(ratings: RatingsMatrix, k: number, steps: number = NUM_STEPS, learningRate: number = LEARNING_RATE): Factors {
  let factors = initFactors(ratings.length, ratings[0].length, k);
  for (let i = 0; i < steps; i++) factors = trainStep(factors, ratings, learningRate);
  return factors;
}

/** Total squared error over every observed rating — what training is actually minimizing. */
export function totalError(factors: Factors, ratings: RatingsMatrix): number {
  return observedEntries(ratings).reduce((sum, { user, item, rating }) => sum + (rating - predict(factors, user, item)) ** 2, 0);
}
