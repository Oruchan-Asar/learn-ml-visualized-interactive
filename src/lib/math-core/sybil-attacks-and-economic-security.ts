/**
 * A Sybil attack is just creating many fake identities to gain outsized influence over a network. In a
 * plain peer-to-peer network, identity is free — a keypair costs nothing to generate — so nothing stops
 * one attacker from posing as a thousand nodes. Proof-of-work and proof-of-stake both defend against this
 * the same way: they make *influence* cost a scarce resource (hash power or staked capital), so faking
 * identities no longer helps unless the attacker can also acquire that resource.
 */

/** In a naive P2P network with no resource requirement, creating identities is free — cost is 0 no matter how many. */
export function sybilCost(numIdentities: number, costPerIdentity: number = 0): number {
  return numIdentities * costPerIdentity;
}

/** Total (arbitrary-unit) cost to control 100% of the network's mining power, in this chapter's fixed scenario. */
export const TOTAL_POW_COST = 1_000_000;

/** Total (arbitrary-unit) value of all staked capital, in this chapter's fixed scenario. */
export const TOTAL_STAKE_VALUE = 2_000_000;

/** The fraction of the network's resource an attacker needs to control to force through invalid blocks or rewrite history. */
export const MAJORITY_THRESHOLD = 0.51;

/**
 * The cost to control a given `share` of a resource-backed network — proportional to the share, no
 * matter how many identities that share is split across. This is the mechanism that makes Sybil attacks
 * expensive: the attacker isn't paying per fake node, they're paying per unit of real resource acquired.
 */
export function attackCost(share: number, totalResourceValue: number): number {
  return share * totalResourceValue;
}

/** Cost to mount a 51% attack on the proof-of-work chain in this chapter's fixed scenario. */
export function powAttackCost(share: number = MAJORITY_THRESHOLD): number {
  return attackCost(share, TOTAL_POW_COST);
}

/** Cost to mount a 51% attack on the proof-of-stake chain in this chapter's fixed scenario. */
export function posAttackCost(share: number = MAJORITY_THRESHOLD): number {
  return attackCost(share, TOTAL_STAKE_VALUE);
}

/** Whether a given cost is enough to deter a rational attacker facing this security budget. */
export function isPricedOut(cost: number, securityBudget: number): boolean {
  return cost > securityBudget;
}
