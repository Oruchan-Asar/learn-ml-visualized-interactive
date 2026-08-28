import { toyHash } from "./toy-hash";

export interface Validator {
  id: string;
  /** Stake, in whatever unit the network's token is denominated in. */
  stake: number;
}

/** Four validators with unequal stake, reused across this chapter's worked example and checkpoint. */
export const VALIDATORS: Validator[] = [
  { id: "A", stake: 40 },
  { id: "B", stake: 30 },
  { id: "C", stake: 20 },
  { id: "D", stake: 10 },
];

export function totalStake(validators: Validator[] = VALIDATORS): number {
  return validators.reduce((sum, v) => sum + v.stake, 0);
}

/** The chance a given validator is picked to propose the next block — exactly proportional to its stake. */
export function selectionProbability(validator: Validator, validators: Validator[] = VALIDATORS): number {
  return validator.stake / totalStake(validators);
}

export interface StakeRange {
  id: string;
  /** Inclusive lower bound of this validator's slice of the [0, totalStake) lottery line. */
  start: number;
  /** Exclusive upper bound. */
  end: number;
}

/** Lays every validator's stake out end to end on a [0, totalStake) line — a "lottery" a ticket lands on. */
export function stakeRanges(validators: Validator[] = VALIDATORS): StakeRange[] {
  let cursor = 0;
  return validators.map((v) => {
    const range = { id: v.id, start: cursor, end: cursor + v.stake };
    cursor += v.stake;
    return range;
  });
}

/**
 * Deterministically picks a round's leader: hash the round number into a ticket on the
 * [0, totalStake) line, then find whose stake range it lands in. A real chain would derive this
 * from verifiable randomness (a VRF); this toy version uses toyHash the same way every other
 * chapter in this Part does, just re-scaled to fit the stake total.
 */
export function selectLeader(round: number, validators: Validator[] = VALIDATORS): string {
  const total = totalStake(validators);
  const ticket = toyHash(`epoch-${round}-x`) % total;
  const ranges = stakeRanges(validators);
  const match = ranges.find((r) => ticket >= r.start && ticket < r.end);
  return match!.id;
}

/**
 * The "nothing-at-stake" problem: without slashing, a validator loses nothing by voting for every
 * competing fork at once (unlike proof-of-work, where hash power spent on one chain can't also be
 * spent on another). With slashing, supporting more than one fork simultaneously is punished by
 * forfeiting the validator's entire stake — turning a free action back into an expensive one.
 */
export function slashingLoss(validator: Validator, forksSupported: number, slashingEnabled: boolean): number {
  if (!slashingEnabled) return 0;
  return forksSupported > 1 ? validator.stake : 0;
}
