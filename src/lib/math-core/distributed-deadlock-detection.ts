/**
 * Distributed deadlock detection: each of 3 sites only knows the wait-for edges local to its own
 * resources. No single site's local view contains a cycle — the cycle only exists once you merge
 * every site's local knowledge into one global wait-for graph. That merge-then-search is exactly
 * what a distributed deadlock detector has to do that a single-machine one never needs to.
 */

export const PROCESSES = ["P1", "P2", "P3", "P4", "P5"] as const;
export type ProcessId = (typeof PROCESSES)[number];

export interface LocalView {
  site: string;
  /** Directed wait-for edges known locally: [waiter, holder] means "waiter is blocked waiting on a resource holder holds." */
  edges: [ProcessId, ProcessId][];
}

/**
 * Three sites, each seeing only its own resources' wait-for edges. Site A and B's edges alone form
 * P1 -> P2 -> P3 -> P1 — a cycle — but neither site sees more than one edge of it. P4 -> P5 is a
 * genuine, non-cyclic wait (P5 holds something P4 wants, but P5 isn't waiting on anyone).
 */
export const LOCAL_VIEWS: LocalView[] = [
  { site: "Site A", edges: [["P1", "P2"]] },
  { site: "Site B", edges: [["P2", "P3"]] },
  { site: "Site C", edges: [["P3", "P1"], ["P4", "P5"]] },
];

/** Combines every site's local edges into one global directed wait-for graph, with duplicates removed. */
export function mergeWaitForGraph(views: LocalView[]): [ProcessId, ProcessId][] {
  const seen = new Set<string>();
  const merged: [ProcessId, ProcessId][] = [];
  for (const view of views) {
    for (const edge of view.edges) {
      const key = edge.join("->");
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(edge);
      }
    }
  }
  return merged;
}

/**
 * Depth-first cycle search over the merged directed graph. Returns the first cycle found, as an
 * ordered list of process ids (e.g. ["P1","P2","P3"] meaning P1 -> P2 -> P3 -> P1), or null if the
 * graph is acyclic.
 */
export function findCycle(edges: [ProcessId, ProcessId][]): ProcessId[] | null {
  const adjacency = new Map<ProcessId, ProcessId[]>();
  for (const [from, to] of edges) {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from)!.push(to);
  }

  const visited = new Set<ProcessId>();
  const stack: ProcessId[] = [];
  const onStack = new Set<ProcessId>();

  function dfs(node: ProcessId): ProcessId[] | null {
    visited.add(node);
    stack.push(node);
    onStack.add(node);

    for (const next of adjacency.get(node) ?? []) {
      if (onStack.has(next)) {
        const start = stack.indexOf(next);
        return stack.slice(start);
      }
      if (!visited.has(next)) {
        const found = dfs(next);
        if (found) return found;
      }
    }

    stack.pop();
    onStack.delete(node);
    return null;
  }

  for (const [from] of edges) {
    if (!visited.has(from)) {
      const found = dfs(from);
      if (found) return found;
    }
  }
  return null;
}

/** Whether a given site's OWN local view, taken alone, already contains a cycle. */
export function localViewHasCycle(view: LocalView): boolean {
  return findCycle(view.edges) !== null;
}
