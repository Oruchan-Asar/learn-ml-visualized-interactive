/**
 * ROME represents a fact as a (key, value) pair sitting inside one weight matrix: querying it with the
 * subject's key vector reads back the object's value vector, W·k ≈ v. Editing a single fact is a
 * closed-form rank-1 update to W that forces W·k onto a new target value exactly, while leaving W's
 * response to every OTHER key that happens to be orthogonal to this one completely untouched — no
 * retraining, no gradient steps.
 */
export type Vec2 = [number, number];
export type Mat2 = [Vec2, Vec2];

export const K_FRANCE: Vec2 = [1, 0];
export const K_GERMANY: Vec2 = [0, 1];

export const V_PARIS: Vec2 = [2, 1];
export const V_BERLIN: Vec2 = [0, 3];
export const V_ROME: Vec2 = [0, 4];

/** The original weight matrix: W·k_France = v_Paris, W·k_Germany = v_Berlin. */
export const W: Mat2 = [
  [2, 0],
  [1, 3],
];

function matVec(m: Mat2, v: Vec2): Vec2 {
  return [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];
}

function dot(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

/**
 * The ROME rank-1 edit: the update to W that forces W·key onto target exactly, computed in closed
 * form as an outer product of the needed residual with the key, scaled by k^T k.
 */
export function editDelta(w: Mat2, key: Vec2, target: Vec2): Mat2 {
  const current = matVec(w, key);
  const residual: Vec2 = [target[0] - current[0], target[1] - current[1]];
  const kk = dot(key, key);
  return [
    [(residual[0] * key[0]) / kk, (residual[0] * key[1]) / kk],
    [(residual[1] * key[0]) / kk, (residual[1] * key[1]) / kk],
  ];
}

/** The full France->Rome rank-1 update, computed once against the original W. */
export const DELTA_FULL: Mat2 = editDelta(W, K_FRANCE, V_ROME);

/** The weight matrix after applying an alpha-fraction (0 = no edit, 1 = full edit) of that update. */
export function editedWeights(alpha: number): Mat2 {
  return [
    [W[0][0] + alpha * DELTA_FULL[0][0], W[0][1] + alpha * DELTA_FULL[0][1]],
    [W[1][0] + alpha * DELTA_FULL[1][0], W[1][1] + alpha * DELTA_FULL[1][1]],
  ];
}

export function outputFor(alpha: number, key: Vec2): Vec2 {
  return matVec(editedWeights(alpha), key);
}

/** How much of `target` the output actually retrieves: 1.0 means an exact match to target's own scale. */
export function retrievalScore(output: Vec2, target: Vec2): number {
  return dot(output, target) / dot(target, target);
}

/** The edited fact: how strongly "capital of France" now retrieves Rome, at edit strength alpha. */
export function franceRomeScore(alpha: number): number {
  return retrievalScore(outputFor(alpha, K_FRANCE), V_ROME);
}

/** The control fact: how strongly "capital of Germany" retrieves Berlin — should stay flat at 1.0. */
export function germanyBerlinScore(alpha: number): number {
  return retrievalScore(outputFor(alpha, K_GERMANY), V_BERLIN);
}
