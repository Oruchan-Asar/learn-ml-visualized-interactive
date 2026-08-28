/**
 * The Chandy-Lamport global snapshot algorithm: capture a consistent picture of every process's
 * state AND every channel's in-flight messages, without ever pausing the system. Three nodes,
 * fully connected (every ordered pair has its own directed channel, 6 channels total).
 *
 * The rule that makes it work: whoever initiates records its own state, then immediately starts
 * logging whatever arrives on each of its incoming channels. The first marker any node receives
 * (on any channel) tells that node "record your own state right now" — and that same channel is
 * recorded as empty, since nothing could have arrived on it after you started recording that's
 * older than the marker itself (channels are FIFO). Every OTHER incoming channel keeps logging
 * messages until ITS marker shows up — whatever was logged when the marker arrives is that
 * channel's final, recorded state. Once every node has recorded its own state and closed every
 * incoming channel, the snapshot is done: local states plus channel logs form one consistent cut.
 */

export type NodeId = "N0" | "N1" | "N2";
export const NODES: NodeId[] = ["N0", "N1", "N2"];

export interface AppMessage {
  id: string;
  from: NodeId;
  to: NodeId;
  amount: number;
  description: string;
}

/**
 * One event in the fixed global trace used throughout this chapter. "initiate" is the snapshot's
 * starting point (one node, no incoming marker triggers it). Every other kind names the channel
 * it moves along via `from` (sender) and `to` (receiver).
 */
export interface SnapshotEvent {
  index: number;
  kind: "app-send" | "app-receive" | "initiate" | "marker-send" | "marker-receive";
  node?: NodeId;
  from?: NodeId;
  to?: NodeId;
  message?: AppMessage;
  description: string;
}

export function channelKey(from: NodeId, to: NodeId): string {
  return `${from}->${to}`;
}

/** Every directed channel between distinct nodes — 3 nodes, fully connected, gives 6. */
export const ALL_CHANNELS: [NodeId, NodeId][] = NODES.flatMap((from) => NODES.filter((to) => to !== from).map((to): [NodeId, NodeId] => [from, to]));

export const INITIAL_BALANCES: Record<NodeId, number> = { N0: 10, N1: 10, N2: 15 };
/** Sum of every node's starting balance — the invariant a correct snapshot must reproduce exactly. */
export const TOTAL_MONEY: number = NODES.reduce((sum, n) => sum + INITIAL_BALANCES[n], 0);

export const MESSAGE_M1: AppMessage = { id: "m1", from: "N2", to: "N0", amount: 5, description: "$5 transfer" };

/**
 * The fixed 15-event trace: N2 sends $5 to N0 before the snapshot starts, then N0 initiates. That
 * $5 is still crossing the network when N0 records its own state, and only arrives after — it has
 * to be captured in channel N2->N0's recorded state, or the snapshot loses it entirely.
 */
export const EVENTS: SnapshotEvent[] = [
  { index: 0, kind: "app-send", from: "N2", to: "N0", message: MESSAGE_M1, description: "N2 sends $5 to N0 (in flight, before anyone knows a snapshot is starting)." },
  { index: 1, kind: "initiate", node: "N0", description: "N0 initiates: records its own balance and starts recording both of its incoming channels." },
  { index: 2, kind: "marker-send", from: "N0", to: "N1", description: "N0 sends a MARKER to N1." },
  { index: 3, kind: "marker-send", from: "N0", to: "N2", description: "N0 sends a MARKER to N2." },
  { index: 4, kind: "app-receive", from: "N2", to: "N0", message: MESSAGE_M1, description: "N0 receives the $5 from N2 — channel N2->N0 is still open, so this gets logged." },
  { index: 5, kind: "marker-receive", from: "N0", to: "N1", description: "N1 receives its first MARKER (from N0): records its own balance; channel N0->N1 recorded as empty." },
  { index: 6, kind: "marker-send", from: "N1", to: "N0", description: "N1 sends a MARKER to N0." },
  { index: 7, kind: "marker-send", from: "N1", to: "N2", description: "N1 sends a MARKER to N2." },
  { index: 8, kind: "marker-receive", from: "N0", to: "N2", description: "N2 receives its first MARKER (from N0): records its own balance; channel N0->N2 recorded as empty." },
  { index: 9, kind: "marker-send", from: "N2", to: "N0", description: "N2 sends a MARKER to N0." },
  { index: 10, kind: "marker-send", from: "N2", to: "N1", description: "N2 sends a MARKER to N1." },
  { index: 11, kind: "marker-receive", from: "N1", to: "N0", description: "N0 already recorded — this closes channel N1->N0: nothing arrived on it, so it's empty." },
  { index: 12, kind: "marker-receive", from: "N2", to: "N0", description: "N0 already recorded — this closes channel N2->N0: the $5 logged earlier is its final recorded state." },
  { index: 13, kind: "marker-receive", from: "N2", to: "N1", description: "N1 already recorded — this closes channel N2->N1: nothing arrived on it, so it's empty." },
  { index: 14, kind: "marker-receive", from: "N1", to: "N2", description: "N2 already recorded — this closes channel N1->N2: nothing arrived on it, so it's empty. Every node has now closed every incoming channel — the snapshot is complete." },
];

export type ChannelStatus = "not-yet-recording" | "recording" | "closed";

export interface ChannelState {
  from: NodeId;
  to: NodeId;
  status: ChannelStatus;
  /** Messages logged on this channel: the running log if still "recording", the final log once "closed". */
  messages: AppMessage[];
}

export interface SnapshotResult {
  /** A node's recorded balance, or undefined if it hasn't taken its snapshot yet within this event prefix. */
  recordedStates: Partial<Record<NodeId, number>>;
  channels: ChannelState[];
  /** The event index at which every node had recorded its state and closed every incoming channel, or null if not yet complete. */
  completedAtIndex: number | null;
}

interface NodeSimState {
  liveBalance: number;
  recorded: boolean;
  recordedValue: number | null;
  /** Incoming channels still open for logging, keyed by sender. */
  recordingFrom: Set<NodeId>;
  channelLog: Map<NodeId, AppMessage[]>;
  closedChannels: Map<NodeId, AppMessage[]>;
}

/**
 * Runs the Chandy-Lamport algorithm over a prefix of the event trace, exactly as the rules
 * dictate: a node's first marker (or its own initiation) fixes its recorded balance and opens
 * every other incoming channel for logging; a later marker on an already-open channel closes it,
 * freezing whatever was logged. Pure function of the event list and the starting balances — no
 * hidden state, so re-running on a shorter prefix reproduces exactly what the snapshot looked like
 * at that point in the trace.
 */
export function runSnapshot(events: SnapshotEvent[] = EVENTS, initialBalances: Record<NodeId, number> = INITIAL_BALANCES): SnapshotResult {
  const sim = new Map<NodeId, NodeSimState>();
  for (const n of NODES) {
    sim.set(n, {
      liveBalance: initialBalances[n],
      recorded: false,
      recordedValue: null,
      recordingFrom: new Set(),
      channelLog: new Map(),
      closedChannels: new Map(),
    });
  }

  const otherNodes = (n: NodeId) => NODES.filter((x) => x !== n);
  let completedAtIndex: number | null = null;

  const allDone = () => NODES.every((n) => {
    const s = sim.get(n)!;
    return s.recorded && s.recordingFrom.size === 0;
  });

  for (const ev of events) {
    if (ev.kind === "app-send") {
      sim.get(ev.from!)!.liveBalance -= ev.message!.amount;
    } else if (ev.kind === "app-receive") {
      const receiver = sim.get(ev.to!)!;
      receiver.liveBalance += ev.message!.amount;
      if (receiver.recorded && receiver.recordingFrom.has(ev.from!)) {
        const log = receiver.channelLog.get(ev.from!) ?? [];
        log.push(ev.message!);
        receiver.channelLog.set(ev.from!, log);
      }
    } else if (ev.kind === "initiate") {
      const n = sim.get(ev.node!)!;
      n.recorded = true;
      n.recordedValue = n.liveBalance;
      for (const other of otherNodes(ev.node!)) n.recordingFrom.add(other);
    } else if (ev.kind === "marker-receive") {
      const receiver = sim.get(ev.to!)!;
      const sender = ev.from!;
      if (!receiver.recorded) {
        receiver.recorded = true;
        receiver.recordedValue = receiver.liveBalance;
        for (const other of otherNodes(ev.to!)) {
          if (other !== sender) receiver.recordingFrom.add(other);
        }
        receiver.closedChannels.set(sender, []);
      } else {
        const log = receiver.channelLog.get(sender) ?? [];
        receiver.closedChannels.set(sender, log);
        receiver.recordingFrom.delete(sender);
      }
    }
    // "marker-send" carries no simulation bookkeeping of its own.

    if (completedAtIndex === null && allDone()) completedAtIndex = ev.index;
  }

  const recordedStates: Partial<Record<NodeId, number>> = {};
  for (const n of NODES) {
    const v = sim.get(n)!.recordedValue;
    if (v !== null) recordedStates[n] = v;
  }

  const channels: ChannelState[] = ALL_CHANNELS.map(([from, to]) => {
    const receiver = sim.get(to)!;
    if (receiver.closedChannels.has(from)) {
      return { from, to, status: "closed", messages: receiver.closedChannels.get(from)! };
    }
    if (receiver.recorded && receiver.recordingFrom.has(from)) {
      return { from, to, status: "recording", messages: receiver.channelLog.get(from) ?? [] };
    }
    return { from, to, status: "not-yet-recording", messages: [] };
  });

  return { recordedStates, channels, completedAtIndex };
}

/** Sum of every recorded balance plus every channel's recorded (or in-progress) message total. */
export function snapshotTotal(result: SnapshotResult): number {
  const stateSum = NODES.reduce((sum, n) => sum + (result.recordedStates[n] ?? 0), 0);
  const channelSum = result.channels.reduce((sum, c) => sum + c.messages.reduce((s, m) => s + m.amount, 0), 0);
  return stateSum + channelSum;
}

/** Sum of recorded balances only, ignoring channel state entirely — what you'd get without markers. */
export function stateOnlyTotal(result: SnapshotResult): number {
  return NODES.reduce((sum, n) => sum + (result.recordedStates[n] ?? 0), 0);
}

/** Whether the (completed) snapshot's total matches the true starting total — the whole point of recording channel state. */
export function isConsistentSnapshot(result: SnapshotResult, expectedTotal: number = TOTAL_MONEY): boolean {
  return snapshotTotal(result) === expectedTotal;
}
