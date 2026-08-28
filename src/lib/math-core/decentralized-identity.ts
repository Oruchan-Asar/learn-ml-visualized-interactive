import { toyHash, toyHashPair } from "./toy-hash";

/**
 * A toy verifiable credential: (issuer, subject, claim, signature). The "signature" stands in for
 * a real digital signature — a value only that exact (issuer, subject, claim) triple could produce.
 * A verifier recomputes it from the credential's own fields and checks the issuer against a small,
 * previously-published trusted-issuer list — entirely locally, with no live call back to the issuer.
 * Tamper one character of the claim and the recomputed signature stops matching; that's the whole
 * self-sovereign-identity trick, expressed with the course's shared toy hash instead of real crypto.
 */

export interface Credential {
  issuer: string;
  subject: string;
  claim: string;
  signature: number;
}

export const TRUSTED_ISSUERS = ["State DMV", "University Registrar"];

/** Toy signing function: deterministic from the triple, but not invertible — nobody can forge a
 *  matching signature for a different claim without reproducing this exact computation. */
export function sign(issuer: string, subject: string, claim: string): number {
  return toyHashPair(toyHash(issuer), toyHash(`${subject}|${claim}`));
}

export function issueCredential(issuer: string, subject: string, claim: string): Credential {
  return { issuer, subject, claim, signature: sign(issuer, subject, claim) };
}

export interface VerificationResult {
  signatureValid: boolean;
  issuerTrusted: boolean;
  valid: boolean;
}

/** Verifies a credential entirely offline: recompute the signature, and check the issuer against a
 *  registry that was published once, in advance — no round trip to the issuer at verification time. */
export function verifyCredential(cred: Credential, trustedIssuers: string[] = TRUSTED_ISSUERS): VerificationResult {
  const signatureValid = sign(cred.issuer, cred.subject, cred.claim) === cred.signature;
  const issuerTrusted = trustedIssuers.includes(cred.issuer);
  return { signatureValid, issuerTrusted, valid: signatureValid && issuerTrusted };
}
