import { GRID_VALUES, INSTANCE, model, evaluateAnchor, ANCHOR_SINGLE, ANCHOR_CONJUNCTION, allGridPoints } from "./anchors-rule-based-explanations";
import { bestFeatureSplit, splitByThreshold, type Point as TreePoint } from "./tree-feature-importance";

export { GRID_VALUES, INSTANCE, model, evaluateAnchor, ANCHOR_SINGLE, ANCHOR_CONJUNCTION };

/** One model, one instance, audited five different ways — reusing the exact machinery of the last four chapters. */

// --- 1. Anchors (reused verbatim from the anchors chapter) ---
export function anchorsAudit() {
  return { single: evaluateAnchor(ANCHOR_SINGLE), conjunction: evaluateAnchor(ANCHOR_CONJUNCTION) };
}

// --- 2. Tree-based importance: build a fresh tree on this model's own grid ---
function toTreePoints(): TreePoint[] {
  return allGridPoints().map((p) => ({ x1: p.x1, x2: p.x2, label: String(model(p.x1, p.x2)) }));
}

export function treeAudit() {
  const data = toTreePoints();
  const root = bestFeatureSplit(data);
  if (!root) throw new Error("Expected a valid root split.");
  const { left, right } = splitByThreshold(data, root.feature, root.threshold);
  const leftSplit = bestFeatureSplit(left);
  const rightSplit = bestFeatureSplit(right);
  const total = data.length;
  const raw: Record<"x1" | "x2", number> = { x1: 0, x2: 0 };
  raw[root.feature] += (data.length / total) * root.gain;
  if (leftSplit && leftSplit.gain > 0) raw[leftSplit.feature] += (left.length / total) * leftSplit.gain;
  if (rightSplit && rightSplit.gain > 0) raw[rightSplit.feature] += (right.length / total) * rightSplit.gain;
  return { root, leftSplit, rightSplit, raw };
}

// --- 3. Shapley values: the AND-model's value on each coalition of {x1 present, x2 present} ---
function coalitionValue(x1Present: boolean, x2Present: boolean): number {
  return model(x1Present ? INSTANCE.x1 : 0, x2Present ? INSTANCE.x2 : 0);
}

export function shapleyAudit() {
  const v_none = coalitionValue(false, false);
  const v_x1 = coalitionValue(true, false);
  const v_x2 = coalitionValue(false, true);
  const v_both = coalitionValue(true, true);
  // Two orderings: [x1 first, x2 first].
  const shapleyX1 = ((v_x1 - v_none) + (v_both - v_x2)) / 2;
  const shapleyX2 = ((v_x2 - v_none) + (v_both - v_x1)) / 2;
  return { v_none, v_x1, v_x2, v_both, shapleyX1, shapleyX2 };
}

// --- 4. Integrated gradients: a smooth surrogate of the same AND-boundary, integrated along the diagonal path ---
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
export const SURROGATE_STEEPNESS = 2;
export function surrogate(x1: number, x2: number): number {
  return sigmoid(SURROGATE_STEEPNESS * (x1 - 3)) * sigmoid(SURROGATE_STEEPNESS * (x2 - 3));
}

export function integratedGradientsAudit(steps: number = 500) {
  const k = SURROGATE_STEEPNESS;
  let sumGrad1 = 0;
  let sumGrad2 = 0;
  for (let i = 1; i <= steps; i++) {
    const alpha = i / steps;
    const x1 = alpha * INSTANCE.x1;
    const x2 = alpha * INSTANCE.x2;
    const s1 = sigmoid(k * (x1 - 3));
    const s2 = sigmoid(k * (x2 - 3));
    sumGrad1 += k * s1 * (1 - s1) * s2;
    sumGrad2 += k * s2 * (1 - s2) * s1;
  }
  const ig1 = INSTANCE.x1 * (sumGrad1 / steps);
  const ig2 = INSTANCE.x2 * (sumGrad2 / steps);
  const trueDelta = surrogate(INSTANCE.x1, INSTANCE.x2) - surrogate(0, 0);
  return { ig1, ig2, trueDelta, sum: ig1 + ig2 };
}

// --- 5. Partial dependence: sweep x1 across the grid, holding x2 at a few representative rows ---
export const PDP_ROWS: number[] = [0, 3, 6];

export function pdpAudit(grid: number[] = GRID_VALUES) {
  return grid.map((x1) => {
    const vals = PDP_ROWS.map((x2) => surrogate(x1, x2));
    return { x1, avg: vals.reduce((a, b) => a + b, 0) / vals.length, vals };
  });
}
