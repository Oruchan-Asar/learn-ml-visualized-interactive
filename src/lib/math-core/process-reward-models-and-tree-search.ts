/**
 * An Outcome Reward Model only scores the final answer. A Process Reward Model (PRM) scores each
 * intermediate reasoning STEP -- how likely is a partial derivation to still be on track to a
 * correct answer? That per-step signal is what makes tree search over reasoning possible: instead
 * of generating one linear chain and hoping, branch at each step and use the PRM's scores to pick
 * which partial path is worth continuing.
 *
 * The toy tree below has one root problem, 3 first-step branches, and 2 second-step children per
 * branch -- each edge carrying a hand-picked PRM score (probability this step is still on track).
 * A path's overall score is the PRODUCT of the step scores along it, exactly like chaining
 * conditional probabilities.
 */

export interface StepNode {
  id: string;
  score: number;
  children?: StepNode[];
}

export const REASONING_TREE: StepNode = {
  id: "root",
  score: 1,
  children: [
    {
      id: "A",
      score: 0.9, // looks like the most promising first step in isolation
      children: [
        { id: "A1", score: 0.3 },
        { id: "A2", score: 0.2 },
      ],
    },
    {
      id: "B",
      score: 0.5,
      children: [
        { id: "B1", score: 0.6 },
        { id: "B2", score: 0.4 },
      ],
    },
    {
      id: "C",
      score: 0.35, // looks like the WEAKEST first step in isolation
      children: [
        { id: "C1", score: 0.2 },
        { id: "C2", score: 0.95 }, // but leads to the strongest second step of the whole tree
      ],
    },
  ],
};

export interface Path {
  ids: [string, string];
  product: number;
}

/** Every root-to-leaf path through the tree, with its PRM score (the product along the path). */
export function allPaths(tree: StepNode = REASONING_TREE): Path[] {
  const paths: Path[] = [];
  for (const first of tree.children ?? []) {
    for (const second of first.children ?? []) {
      paths.push({ ids: [first.id, second.id], product: first.score * second.score });
    }
  }
  return paths;
}

/** Tree search: evaluate every full path and keep the one with the highest PRM score. */
export function bestPath(tree: StepNode = REASONING_TREE): Path {
  const paths = allPaths(tree);
  return paths.reduce((best, p) => (p.product > best.product ? p : best), paths[0]);
}

/**
 * The greedy baseline tree search replaces: pick the best-LOOKING first step by its own score
 * alone, then the best child of just that step -- never comparing across branches, never looking
 * ahead. This is exactly what a single linear chain-of-thought sample effectively does.
 */
export function greedyPath(tree: StepNode = REASONING_TREE): Path {
  const children = tree.children ?? [];
  const bestFirst = children.reduce((best, c) => (c.score > best.score ? c : best), children[0]);
  const grandchildren = bestFirst.children ?? [];
  const bestSecond = grandchildren.reduce((best, c) => (c.score > best.score ? c : best), grandchildren[0]);
  return { ids: [bestFirst.id, bestSecond.id], product: bestFirst.score * bestSecond.score };
}
