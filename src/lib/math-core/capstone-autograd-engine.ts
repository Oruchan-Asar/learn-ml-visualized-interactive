export type NodeOp = "input" | "add" | "mul";

export interface GraphNode {
  id: string;
  op: NodeOp;
  /** ids of this node's inputs, in order; empty for "input" nodes. */
  inputs: string[];
  /** Layout hint for the diagram, not used by the math. */
  x: number;
  y: number;
}

/**
 * The computational graph for f(a,b) = a*b + a:
 *   n1 = a * b
 *   n2 = n1 + a   (the output)
 * Notice `a` feeds two different nodes — that's the case that makes reverse-mode
 * autodiff interesting: its gradient accumulates contributions from both paths.
 */
export const GRAPH: GraphNode[] = [
  { id: "a", op: "input", inputs: [], x: 50, y: 175 },
  { id: "b", op: "input", inputs: [], x: 50, y: 65 },
  { id: "n1", op: "mul", inputs: ["a", "b"], x: 160, y: 120 },
  { id: "n2", op: "add", inputs: ["n1", "a"], x: 270, y: 120 },
];

export const OUTPUT_ID = "n2";
export const GRAPH_EDGES: [string, string][] = [
  ["a", "n1"],
  ["b", "n1"],
  ["n1", "n2"],
  ["a", "n2"],
];

/** Runs every node in declared order, computing each one from its already-known inputs. */
export function forwardPass(inputValues: Record<string, number>): Record<string, number> {
  const values: Record<string, number> = { ...inputValues };
  for (const node of GRAPH) {
    if (node.op === "input") continue;
    const [i1, i2] = node.inputs;
    values[node.id] = node.op === "add" ? values[i1] + values[i2] : values[i1] * values[i2];
  }
  return values;
}

/**
 * Reverse-mode backward pass: seed the output's gradient at 1, then walk the graph
 * back to front, distributing each node's incoming gradient to its inputs via the
 * chain rule's local rule for that node (sum: pass through unchanged; product: multiply
 * by the *other* input's forward value). A node used more than once — like `a` here —
 * accumulates gradient from every path that uses it.
 */
export function backwardPass(values: Record<string, number>): Record<string, number> {
  const grads: Record<string, number> = {};
  for (const node of GRAPH) grads[node.id] = 0;
  grads[OUTPUT_ID] = 1;

  for (let i = GRAPH.length - 1; i >= 0; i--) {
    const node = GRAPH[i];
    if (node.op === "input") continue;
    const [i1, i2] = node.inputs;
    const upstream = grads[node.id];
    if (node.op === "add") {
      grads[i1] += upstream;
      grads[i2] += upstream;
    } else {
      grads[i1] += upstream * values[i2];
      grads[i2] += upstream * values[i1];
    }
  }
  return grads;
}

/** f(a,b) = a*b + a, obtained by running the graph forward. */
export function f(a: number, b: number): number {
  return forwardPass({ a, b })[OUTPUT_ID];
}

/** The exact analytic gradient, for cross-checking the graph's backward pass: ∂f/∂a = b+1, ∂f/∂b = a. */
export function analyticGradient(a: number, b: number): { da: number; db: number } {
  return { da: b + 1, db: a };
}

/** Central-difference numerical gradient, used only to cross-check `backwardPass`. */
export function numericalGradient(a: number, b: number, h = 1e-4): { da: number; db: number } {
  return {
    da: (f(a + h, b) - f(a - h, b)) / (2 * h),
    db: (f(a, b + h) - f(a, b - h)) / (2 * h),
  };
}
