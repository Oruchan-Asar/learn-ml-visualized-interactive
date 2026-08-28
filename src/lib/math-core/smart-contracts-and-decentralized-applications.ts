import { toyHash } from "./toy-hash";

/**
 * A toy escrow contract: buyer deposits funds, then the contract either releases them to the seller
 * or refunds them to the buyer. Every node that replays the same actions against the same starting
 * state computes the exact same sequence of states — that determinism is what lets the state itself
 * (not a trusted server) serve as the thing the network agrees on.
 */
export interface ContractState {
  phase: "created" | "funded" | "released" | "refunded";
  balance: number;
  buyer: string;
  seller: string;
}

export const BUYER = "alice";
export const SELLER = "bob";
export const DEPOSIT_AMOUNT = 50;

export const INITIAL_STATE: ContractState = { phase: "created", balance: 0, buyer: BUYER, seller: SELLER };

/** Hashes a contract's state — every node computes this independently, and agreement on the hash *is* agreement on the state. */
export function stateHash(state: ContractState): number {
  return toyHash(`${state.phase}|${state.balance}|${state.buyer}|${state.seller}`);
}

export type Action = { type: "deposit"; amount: number } | { type: "release" } | { type: "refund" };

/**
 * The contract's entire logic: a pure function from (state, action) to the next state. No node needs
 * to trust any other node's answer — everyone runs this same function and gets the same result, so
 * "the contract's code" and "the rule every node checks against" are literally the same thing.
 */
export function applyAction(state: ContractState, action: Action): ContractState {
  if (action.type === "deposit") {
    if (state.phase !== "created") return state;
    return { ...state, phase: "funded", balance: action.amount };
  }
  if (action.type === "release") {
    if (state.phase !== "funded") return state;
    return { ...state, phase: "released" };
  }
  // action.type === "refund"
  if (state.phase !== "funded") return state;
  return { ...state, phase: "refunded" };
}

export interface TraceEntry {
  label: string;
  state: ContractState;
  hash: number;
}

/**
 * Runs the fixed deposit-then-decide script against `INITIAL_STATE`, branching at the end on
 * `outcome`. Passing `null` stops right after funding, leaving the decision pending — useful for the
 * step-through demo, which lets a reader choose the ending themselves.
 */
export function runEscrow(outcome: "release" | "refund" | null): TraceEntry[] {
  const trace: TraceEntry[] = [{ label: "Contract created", state: INITIAL_STATE, hash: stateHash(INITIAL_STATE) }];

  const funded = applyAction(INITIAL_STATE, { type: "deposit", amount: DEPOSIT_AMOUNT });
  trace.push({ label: `${BUYER} deposits ${DEPOSIT_AMOUNT}`, state: funded, hash: stateHash(funded) });

  if (outcome === null) return trace;

  const action: Action = outcome === "release" ? { type: "release" } : { type: "refund" };
  const finalState = applyAction(funded, action);
  const label = outcome === "release" ? `Condition met — release to ${SELLER}` : `Condition failed — refund to ${BUYER}`;
  trace.push({ label, state: finalState, hash: stateHash(finalState) });

  return trace;
}
