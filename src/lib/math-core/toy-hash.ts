/**
 * A small, deterministic, hand-computable stand-in for a real cryptographic hash
 * (SHA-256 etc.) — never secure, but exhibits the same qualitative behavior
 * (avalanche effect, fixed output range) with numbers a person can verify by hand
 * or a short brute-force loop. Shared across every Part V (blockchain) chapter so
 * "hash of a block", "hash of a Merkle pair", and "mine a nonce" all mean the same
 * concrete function throughout the course.
 */
export function toyHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) % 1000;
  }
  return h;
}

/** Combines two child hashes into a parent hash, for a toy Merkle tree. */
export function toyHashPair(left: number, right: number): number {
  return toyHash(`${left}|${right}`);
}
