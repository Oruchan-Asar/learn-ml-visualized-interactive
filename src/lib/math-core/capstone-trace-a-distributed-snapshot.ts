/**
 * Capstone: the same 3-node Chandy-Lamport algorithm from the previous chapter (`runSnapshot`,
 * reused unchanged), run over a fresh trace with a different initiator and TWO in-flight messages
 * instead of one — so reconstructing the consistent cut now means tracking two channels at once,
 * not just one.
 */

import {
  NODES,
  ALL_CHANNELS,
  runSnapshot,
  snapshotTotal,
  stateOnlyTotal,
  isConsistentSnapshot as isConsistentSnapshotAgainst,
  channelKey,
  type NodeId,
  type AppMessage,
  type SnapshotEvent,
  type SnapshotResult,
  type ChannelState,
} from "./chandy-lamport-snapshots";

export { NODES, ALL_CHANNELS, snapshotTotal, stateOnlyTotal, channelKey };
export type { NodeId, AppMessage, SnapshotEvent, SnapshotResult, ChannelState };

/** N1 initiates this time. N0=10, N1=5, N2=15 (total 30). */
export const INITIAL_BALANCES: Record<NodeId, number> = { N0: 10, N1: 5, N2: 15 };
export const TOTAL_MONEY: number = NODES.reduce((sum, n) => sum + INITIAL_BALANCES[n], 0);

/** Same check as the previous chapter's `isConsistentSnapshot`, defaulted to THIS scenario's total. */
export function isConsistentSnapshot(result: SnapshotResult, expectedTotal: number = TOTAL_MONEY): boolean {
  return isConsistentSnapshotAgainst(result, expectedTotal);
}

export const MESSAGE_M1: AppMessage = { id: "m1", from: "N2", to: "N0", amount: 4, description: "$4 transfer" };
export const MESSAGE_M2: AppMessage = { id: "m2", from: "N0", to: "N1", amount: 6, description: "$6 transfer" };

/**
 * 17 events. N1 is the initiator, so both of its incoming channels (N0->N1 and N2->N1) start
 * "recording" the instant it initiates — long before N0 or N2 have even recorded their own state.
 * That gives message m2 (N0 -> N1) a wide-open window to be captured on channel N0->N1, in addition
 * to m1 (N2 -> N0) landing on channel N2->N0, exactly like the previous chapter.
 */
export const EVENTS: SnapshotEvent[] = [
  { index: 0, kind: "app-send", from: "N2", to: "N0", message: MESSAGE_M1, description: "N2 sends $4 to N0 (in flight, before any snapshot begins)." },
  { index: 1, kind: "initiate", node: "N1", description: "N1 initiates: records its own balance and starts recording both of its incoming channels, N0->N1 and N2->N1." },
  { index: 2, kind: "marker-send", from: "N1", to: "N0", description: "N1 sends a MARKER to N0." },
  { index: 3, kind: "marker-send", from: "N1", to: "N2", description: "N1 sends a MARKER to N2." },
  { index: 4, kind: "app-send", from: "N0", to: "N1", message: MESSAGE_M2, description: "N0 sends $6 to N1 (in flight — N1 is already recording channel N0->N1)." },
  { index: 5, kind: "marker-receive", from: "N1", to: "N0", description: "N0 receives its first MARKER (from N1): records its own balance; channel N1->N0 recorded as empty." },
  { index: 6, kind: "marker-send", from: "N0", to: "N1", description: "N0 sends a MARKER to N1." },
  { index: 7, kind: "marker-send", from: "N0", to: "N2", description: "N0 sends a MARKER to N2." },
  { index: 8, kind: "app-receive", from: "N0", to: "N1", message: MESSAGE_M2, description: "N1 receives the $6 from N0 — channel N0->N1 is still open, so this gets logged." },
  { index: 9, kind: "marker-receive", from: "N1", to: "N2", description: "N2 receives its first MARKER (from N1): records its own balance; channel N1->N2 recorded as empty." },
  { index: 10, kind: "marker-send", from: "N2", to: "N0", description: "N2 sends a MARKER to N0." },
  { index: 11, kind: "marker-send", from: "N2", to: "N1", description: "N2 sends a MARKER to N1." },
  { index: 12, kind: "app-receive", from: "N2", to: "N0", message: MESSAGE_M1, description: "N0 receives the $4 from N2 — channel N2->N0 is still open, so this gets logged." },
  { index: 13, kind: "marker-receive", from: "N0", to: "N1", description: "N1 already recorded — this closes channel N0->N1: the $6 logged earlier is its final recorded state." },
  { index: 14, kind: "marker-receive", from: "N0", to: "N2", description: "N2 already recorded — this closes channel N0->N2: nothing arrived on it, so it's empty." },
  { index: 15, kind: "marker-receive", from: "N2", to: "N0", description: "N0 already recorded — this closes channel N2->N0: the $4 logged earlier is its final recorded state." },
  { index: 16, kind: "marker-receive", from: "N2", to: "N1", description: "N1 already recorded — this closes channel N2->N1: nothing arrived on it, so it's empty. Every node has closed every incoming channel — the snapshot is complete." },
];

/** Reuses the previous chapter's algorithm, unchanged, over this chapter's own trace and balances. */
export function runCapstoneSnapshot(events: SnapshotEvent[] = EVENTS): SnapshotResult {
  return runSnapshot(events, INITIAL_BALANCES);
}
