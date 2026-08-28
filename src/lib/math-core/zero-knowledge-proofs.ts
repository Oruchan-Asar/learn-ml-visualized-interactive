/**
 * A simplified Fiat-Shamir identification scheme — the classic small, hand-traceable zero-knowledge
 * proof: the prover convinces the verifier they know a secret x with x² mod n = y, without ever
 * revealing x. Each round leaks only one of two possible values (r, or r·x mod n), and either one
 * alone is indistinguishable from a random number to the verifier — but a prover who doesn't know x
 * can only prepare an honest answer for one of the two possible challenges, so they get caught with
 * probability 1/2 per round. Not real cryptography (n is tiny, brute-forceable), but the same
 * structure that makes real ZK proofs sound and zero-knowledge.
 */

export const N = 91; // public modulus (= 7 × 13, small enough to check by hand)
export const SECRET_X = 5; // known only to the prover
export const PUBLIC_Y = (SECRET_X * SECRET_X) % N; // public: y = x² mod n = 25

export type Challenge = 0 | 1;

/** Step 1: the prover commits to a fresh random r, publishing c = r² mod n. */
export function commit(r: number): number {
  return (r * r) % N;
}

/** Step 3: the prover answers the verifier's challenge bit — reveal r itself, or r·x mod n. Never x. */
export function respond(r: number, challenge: Challenge, x: number = SECRET_X): number {
  return challenge === 0 ? r : (r * x) % N;
}

/** Step 4: the verifier checks the response against the branch that was actually challenged. */
export function verify(commitment: number, challenge: Challenge, response: number, y: number = PUBLIC_Y): boolean {
  if (challenge === 0) return (response * response) % N === commitment;
  return (response * response) % N === (commitment * y) % N;
}

export interface RoundResult {
  commitment: number;
  challenge: Challenge;
  response: number;
  passed: boolean;
}

/** A full honest round: real prover, real secret, always passes verification. */
export function honestRound(r: number, challenge: Challenge): RoundResult {
  const commitment = commit(r);
  const response = respond(r, challenge);
  return { commitment, challenge, response, passed: verify(commitment, challenge, response) };
}

/**
 * An impostor who does not know x prepares a response for one branch only (here, challenge = 0,
 * honestly presenting r itself) — but has nothing valid to offer if challenged the other way, so we
 * model their best-effort guess `fakeResponse` for that branch, which fails verification unless they
 * get extraordinarily lucky.
 */
export function impostorRound(r: number, challenge: Challenge, fakeResponse: number): RoundResult {
  const commitment = commit(r);
  const response = challenge === 0 ? r : fakeResponse;
  return { commitment, challenge, response, passed: verify(commitment, challenge, response) };
}

/** The probability an impostor fools the verifier across `rounds` independent challenge rounds. */
export function cheatProbability(rounds: number): number {
  return Math.pow(0.5, rounds);
}

/** Smallest number of rounds needed to push the cheating probability at or below a given threshold. */
export function roundsNeededFor(maxCheatProbability: number): number {
  let rounds = 1;
  while (cheatProbability(rounds) > maxCheatProbability) rounds++;
  return rounds;
}
