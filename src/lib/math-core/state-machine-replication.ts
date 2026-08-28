/**
 * State machine replication (SMR): consensus (Raft, Paxos, PBFT — whichever) only needs to agree on
 * one thing, an ordered log of commands. Every replica then applies that exact same log, in that
 * exact same order, to its own copy of a deterministic state machine. Determinism is the whole trick:
 * feed two replicas the same commands in the same order and they end up in the same state, even if
 * one of them was lagging behind and only just caught up.
 *
 * This module is deliberately a tiny key-value register — not a real service — so every intermediate
 * state is something a person can compute by re-adding a column of numbers.
 */

export type Command =
  | { op: "set"; key: string; value: number }
  | { op: "add"; key: string; delta: number }
  | { op: "del"; key: string };

export type State = Record<string, number>;

/** Applies one command to a state, returning a new state (never mutates the input). */
export function applyCommand(state: State, cmd: Command): State {
  switch (cmd.op) {
    case "set":
      return { ...state, [cmd.key]: cmd.value };
    case "add":
      return { ...state, [cmd.key]: (state[cmd.key] ?? 0) + cmd.delta };
    case "del": {
      const next = { ...state };
      delete next[cmd.key];
      return next;
    }
  }
}

/** Applies an ordered list of commands, left to right, starting from `initial`. */
export function applyLog(initial: State, log: Command[]): State {
  return log.reduce(applyCommand, initial);
}

export function statesEqual(a: State, b: State): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

export const INITIAL_STATE: State = {};

/** The canonical, agreed-upon log every replica must apply in this exact order. */
export const LOG: Command[] = [
  { op: "set", key: "x", value: 10 },
  { op: "add", key: "x", delta: 5 },
  { op: "add", key: "x", delta: -3 },
  { op: "set", key: "x", value: 100 },
  { op: "add", key: "x", delta: 1 },
];

/**
 * The exact same five commands, reordered (entry 0 and entry 3 swapped). Same *set* of commands,
 * different order — and because `set` isn't commutative with `add`, the final state differs. This is
 * the reason consensus has to agree on an order, not just on which commands happened.
 */
export const REORDERED_LOG: Command[] = [
  { op: "set", key: "x", value: 100 },
  { op: "add", key: "x", delta: 5 },
  { op: "add", key: "x", delta: -3 },
  { op: "set", key: "x", value: 10 },
  { op: "add", key: "x", delta: 1 },
];

/** The state after applying just the first `n` entries of the canonical log — a lagging replica's view. */
export function appliedPrefix(log: Command[], n: number): State {
  return applyLog(INITIAL_STATE, log.slice(0, n));
}
