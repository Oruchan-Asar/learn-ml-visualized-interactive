/**
 * A small, fixed 8-node gossip network — a "circulant" graph where node i connects to i±1 (a
 * ring) plus i+4 (a diametric shortcut), so every node has exactly 3 neighbors but the graph
 * still has genuine long-range shortcuts, not just a plain ring. Small enough that every round
 * of gossip can be traced by hand.
 */
export const NUM_NODES = 8;

/** Neighbor ids for each node, sorted ascending — index i holds node i's neighbors. */
export const NEIGHBORS: number[][] = [
  [1, 4, 7], // node 0
  [0, 2, 5], // node 1
  [1, 3, 6], // node 2
  [2, 4, 7], // node 3
  [0, 3, 5], // node 4
  [1, 4, 6], // node 5
  [2, 5, 7], // node 6
  [0, 3, 6], // node 7
];

/**
 * Which neighbors a node gossips to during round `round` (0-indexed), given a fixed `fanout`.
 * Peer selection rotates deterministically through the neighbor list — offset = round mod
 * degree — so a node doesn't just keep re-telling the same one or two peers forever; over
 * enough rounds it eventually reaches every neighbor, exactly like a real gossip peer-sampler
 * cycling through its view. With fanout equal to the degree (3), every neighbor is contacted
 * every round regardless of offset — plain epidemic flooding.
 */
export function gossipTargets(nodeId: number, round: number, fanout: number): number[] {
  const list = NEIGHBORS[nodeId];
  const degree = list.length;
  const f = Math.min(fanout, degree);
  const offset = round % degree;
  const targets: number[] = [];
  for (let i = 0; i < f; i++) {
    targets.push(list[(offset + i) % degree]);
  }
  return targets;
}

/** One round: every currently-infected node gossips to its round-`round` targets; returns the new infected set. */
export function gossipStep(infected: ReadonlySet<number>, round: number, fanout: number): Set<number> {
  const next = new Set(infected);
  for (const node of infected) {
    for (const target of gossipTargets(node, round, fanout)) {
      next.add(target);
    }
  }
  return next;
}

/**
 * Runs `rounds` steps of gossip starting from a single infected node, returning every
 * intermediate infected set (sorted arrays) — history[0] is the single starting node,
 * history[k] is the set after k rounds.
 */
export function runGossip(fanout: number, rounds: number, start = 0): number[][] {
  let infected = new Set<number>([start]);
  const history: number[][] = [[...infected].sort((a, b) => a - b)];
  for (let round = 0; round < rounds; round++) {
    infected = gossipStep(infected, round, fanout);
    history.push([...infected].sort((a, b) => a - b));
  }
  return history;
}

/** The fewest rounds needed for every node to have heard the rumor, or -1 if it doesn't happen within maxRounds. */
export function roundsToFullCoverage(fanout: number, start = 0, maxRounds = 10): number {
  let infected = new Set<number>([start]);
  if (infected.size === NUM_NODES) return 0;
  for (let round = 0; round < maxRounds; round++) {
    infected = gossipStep(infected, round, fanout);
    if (infected.size === NUM_NODES) return round + 1;
  }
  return -1;
}
