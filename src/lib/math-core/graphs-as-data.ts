export interface GraphNode {
  id: string;
  x: number;
  y: number;
  /** The node's own feature — a stand-in for whatever real value would live there (an atom's electronegativity, a user's activity level). */
  feature: number;
}

/**
 * A small fixed graph reused across every chapter in this part: a triangle (0-1-2) fused to a two-node
 * tail (3-4, 3-5) through node 1-3 — small enough to trace every sum by hand, varied enough that nodes
 * have genuinely different degrees (leaves 4 and 5 have exactly one neighbor; hub nodes 1 and 3 have three).
 */
export const NODES: GraphNode[] = [
  { id: "0", x: 60, y: 60, feature: 1 },
  { id: "1", x: 130, y: 40, feature: 2 },
  { id: "2", x: 110, y: 110, feature: 0 },
  { id: "3", x: 200, y: 60, feature: 3 },
  { id: "4", x: 270, y: 30, feature: 1 },
  { id: "5", x: 270, y: 100, feature: 2 },
];

export const EDGES: [string, string][] = [
  ["0", "1"],
  ["0", "2"],
  ["1", "2"],
  ["1", "3"],
  ["3", "4"],
  ["3", "5"],
];

export const FEATURES: number[] = NODES.map((n) => n.feature);

/** The adjacency matrix, in NODES order — A[i][j] = 1 if i and j share an edge, 0 otherwise. Symmetric, zero diagonal. */
export function adjacencyMatrix(): number[][] {
  const n = NODES.length;
  const index = new Map(NODES.map((node, i) => [node.id, i]));
  const a = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of EDGES) {
    const i = index.get(u)!;
    const j = index.get(v)!;
    a[i][j] = 1;
    a[j][i] = 1;
  }
  return a;
}

/** The ids of every node directly connected to `id` — no self-inclusion. */
export function neighbors(id: string): string[] {
  const result: string[] = [];
  for (const [u, v] of EDGES) {
    if (u === id) result.push(v);
    if (v === id) result.push(u);
  }
  return result;
}

/** A node's degree — how many edges touch it. */
export function degree(id: string): number {
  return neighbors(id).length;
}

/**
 * Why a grid convolution has nowhere to slide: a fixed 3x3 kernel assumes every pixel has exactly 8
 * neighbors in a fixed spatial arrangement. This returns the actual neighbor count for every node, to
 * make that assumption's failure concrete — it's neither fixed nor uniform here.
 */
export function allDegrees(): Record<string, number> {
  return Object.fromEntries(NODES.map((n) => [n.id, degree(n.id)]));
}
