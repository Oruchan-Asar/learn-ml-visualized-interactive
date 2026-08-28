/**
 * Single-value Paxos: a proposer picks an ever-increasing proposal number and
 * runs two phases against a fixed set of acceptors.
 *
 *  1. Prepare/Promise — the proposer asks acceptors to promise not to accept
 *     any proposal numbered lower than its own. Each acceptor replies with
 *     whatever it had already accepted, if anything.
 *  2. Accept/Accepted — once a majority has promised, the proposer sends an
 *     accept request. Critically, if any acceptor had already accepted a
 *     value, the proposer MUST re-propose that value instead of its own —
 *     this is what keeps a chosen value from ever changing.
 */

export interface AcceptorPromise {
  acceptorId: string;
  /** The proposal number this acceptor had already accepted, if any. */
  acceptedNumber: number | null;
  /** The value that went with it. */
  acceptedValue: string | null;
}

export const ACCEPTOR_IDS = ["A1", "A2", "A3"] as const;

/** More than half of a cluster of the given size. */
export function hasMajority(count: number, clusterSize: number): boolean {
  return count > clusterSize / 2;
}

/**
 * Paxos's safety rule: once a proposer has a majority of promises, it must
 * adopt the value of the highest-numbered proposal any acceptor already
 * accepted — never its own value — if any acceptor reports one at all.
 */
export function valueToPropose(promises: AcceptorPromise[], ownValue: string): string {
  const withAccepted = promises.filter(
    (p): p is AcceptorPromise & { acceptedNumber: number; acceptedValue: string } => p.acceptedNumber !== null,
  );
  if (withAccepted.length === 0) return ownValue;
  const highest = withAccepted.reduce((best, p) => (p.acceptedNumber > best.acceptedNumber ? p : best));
  return highest.acceptedValue;
}

/** A value is chosen once a majority of acceptors have accepted the same proposal. */
export function isChosen(acceptCount: number, clusterSize: number): boolean {
  return hasMajority(acceptCount, clusterSize);
}

/** Round 1: no acceptor has accepted anything yet. */
export const ROUND_1_PROMISES: AcceptorPromise[] = [
  { acceptorId: "A1", acceptedNumber: null, acceptedValue: null },
  { acceptorId: "A2", acceptedNumber: null, acceptedValue: null },
  { acceptorId: "A3", acceptedNumber: null, acceptedValue: null },
];

/** Round 2: a later, higher-numbered proposer runs prepare after A1 already accepted (1, "X"). */
export const ROUND_2_PROMISES: AcceptorPromise[] = [
  { acceptorId: "A1", acceptedNumber: 1, acceptedValue: "X" },
  { acceptorId: "A2", acceptedNumber: null, acceptedValue: null },
  { acceptorId: "A3", acceptedNumber: null, acceptedValue: null },
];
