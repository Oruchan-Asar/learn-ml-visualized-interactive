export const USERS = ["U1", "U2", "U3"] as const;
export const ITEMS = ["I1", "I2", "I3"] as const;
export type User = (typeof USERS)[number];
export type Item = (typeof ITEMS)[number];

/**
 * A 3x3 ratings matrix with one entry deliberately missing (U2's rating of I2) — the thing this
 * chapter predicts. Two clear, opposite taste groups: U1 & U2 like I1/I2 and dislike I3; U3 is the
 * mirror image. That structure is genuinely rank-2, not rank-1 — a fact this chapter verifies rather
 * than assumes.
 */
export const RATINGS: Record<User, Partial<Record<Item, number>>> = {
  U1: { I1: 5, I2: 4, I3: 1 },
  U2: { I1: 4, I3: 1 }, // I2 deliberately missing
  U3: { I1: 1, I2: 1, I3: 5 },
};

export const MISSING: { user: User; item: Item } = { user: "U2", item: "I2" };

export function observedEntries(): { user: User; item: Item; rating: number }[] {
  const entries: { user: User; item: Item; rating: number }[] = [];
  for (const user of USERS) {
    for (const item of ITEMS) {
      const rating = RATINGS[user][item];
      if (rating !== undefined) entries.push({ user, item, rating });
    }
  }
  return entries;
}

export const LEARNING_RATE = 0.05;
export const NUM_STEPS = 2000;

export interface Factors {
  u: Record<User, number[]>;
  v: Record<Item, number[]>;
}

/**
 * A fixed (not random) starting point. Every dimension starts near 0.5, but with a small deterministic
 * offset that varies by both entity index and dimension index — breaking the symmetry that would
 * otherwise make every extra latent dimension a duplicate of the first, forever (exactly the same
 * failure mode as Part III's identical-weight-initialization problem, one level up).
 */
export function initFactors(k: number): Factors {
  const initFor = (entities: readonly string[]) =>
    Object.fromEntries(
      entities.map((e, ei) => [e, Array.from({ length: k }, (_, d) => 0.5 + 0.05 * (ei - d))]),
    ) as Record<string, number[]>;
  return { u: initFor(USERS) as Record<User, number[]>, v: initFor(ITEMS) as Record<Item, number[]> };
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

export function predict(factors: Factors, user: User, item: Item): number {
  return dot(factors.u[user], factors.v[item]);
}

/** One batch gradient descent step across every latent dimension at once — the missing entry never
 * contributes a gradient anywhere, because it's never observed. */
export function trainStep(factors: Factors): Factors {
  const k = factors.u[USERS[0]].length;
  const uGrad: Record<User, number[]> = Object.fromEntries(USERS.map((u) => [u, new Array(k).fill(0)])) as Record<User, number[]>;
  const vGrad: Record<Item, number[]> = Object.fromEntries(ITEMS.map((i) => [i, new Array(k).fill(0)])) as Record<Item, number[]>;

  for (const { user, item, rating } of observedEntries()) {
    const err = rating - predict(factors, user, item);
    for (let d = 0; d < k; d++) {
      uGrad[user][d] += -2 * err * factors.v[item][d];
      vGrad[item][d] += -2 * err * factors.u[user][d];
    }
  }

  const nextU = Object.fromEntries(
    USERS.map((u) => [u, factors.u[u].map((val, d) => val - LEARNING_RATE * uGrad[u][d])]),
  ) as Record<User, number[]>;
  const nextV = Object.fromEntries(
    ITEMS.map((i) => [i, factors.v[i].map((val, d) => val - LEARNING_RATE * vGrad[i][d])]),
  ) as Record<Item, number[]>;
  return { u: nextU, v: nextV };
}

export function train(k: number, steps: number = NUM_STEPS): Factors {
  let factors = initFactors(k);
  for (let i = 0; i < steps; i++) factors = trainStep(factors);
  return factors;
}

/** Total squared error over every observed rating — what training is actually minimizing. */
export function totalError(factors: Factors): number {
  return observedEntries().reduce((sum, { user, item, rating }) => sum + (rating - predict(factors, user, item)) ** 2, 0);
}
