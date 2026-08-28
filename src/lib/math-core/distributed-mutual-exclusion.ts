export interface Request {
  nodeId: string;
  /** This node's Lamport timestamp when it asked for the critical section. */
  timestamp: number;
}

/** Lower timestamp wins; ties are broken by the lower node id — the same total order Lamport clocks always need a tiebreaker for. */
export function hasPriority(mine: Request, theirs: Request): boolean {
  if (mine.timestamp !== theirs.timestamp) return mine.timestamp < theirs.timestamp;
  return mine.nodeId < theirs.nodeId;
}

export type NodeState = "idle" | "requesting" | "in-cs";

/**
 * Ricart-Agrawala's reply rule: defer only if I'm currently in the critical section, or I'm also
 * requesting it and my own request has priority over theirs. Otherwise, reply immediately — I have no
 * claim to go first, so there's no reason to make them wait.
 */
export function shouldReplyImmediately(
  myState: NodeState,
  myRequest: Request | null,
  theirRequest: Request,
): boolean {
  if (myState === "in-cs") return false;
  if (myState === "requesting" && myRequest && hasPriority(myRequest, theirRequest)) return false;
  return true;
}

/** Three nodes requesting the critical section at once — Q and R tie on timestamp, broken by node id. */
export const REQUESTS: Request[] = [
  { nodeId: "P", timestamp: 5 },
  { nodeId: "Q", timestamp: 3 },
  { nodeId: "R", timestamp: 3 },
];

/** The globally smallest (timestamp, id) enters the critical section first — Ricart-Agrawala's whole point is reaching this order without any shared lock. */
export function determineEntryOrder(requests: Request[] = REQUESTS): string[] {
  return [...requests]
    .sort((a, b) => (a.timestamp !== b.timestamp ? a.timestamp - b.timestamp : a.nodeId.localeCompare(b.nodeId)))
    .map((r) => r.nodeId);
}

/** For every ordered (receiver, requester) pair, does the receiver reply immediately, assuming everyone in `requests` is simultaneously requesting? */
export function replyMatrix(requests: Request[] = REQUESTS): Record<string, Record<string, boolean>> {
  const result: Record<string, Record<string, boolean>> = {};
  for (const receiver of requests) {
    result[receiver.nodeId] = {};
    for (const requester of requests) {
      if (receiver.nodeId === requester.nodeId) continue;
      result[receiver.nodeId][requester.nodeId] = shouldReplyImmediately("requesting", receiver, requester);
    }
  }
  return result;
}

/** A 4-node token ring: the token just passes to the next id in a fixed cycle. */
export const RING: string[] = ["P", "Q", "R", "S"];

export function nextTokenHolder(ring: string[], current: string): string {
  const i = ring.indexOf(current);
  return ring[(i + 1) % ring.length];
}
