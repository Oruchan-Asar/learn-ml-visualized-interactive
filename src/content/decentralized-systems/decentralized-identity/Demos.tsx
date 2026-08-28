"use client";

import { useEffect, useId, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TRUSTED_ISSUERS,
  issueCredential,
  verifyCredential,
} from "@/lib/math-core/decentralized-identity";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import traceStyles from "../zero-knowledge-proofs/Trace.module.css";
import styles from "../ipfs-and-content-addressed-storage/Controls.module.css";

const CONCEPT_ID = "decentralized-identity";
const SUBJECT = "Alice";
const ISSUED_CLAIM = "over-21";
const ORIGINAL = issueCredential("State DMV", SUBJECT, ISSUED_CLAIM);
const ALL_ISSUERS = [...TRUSTED_ISSUERS, "Fake Issuer"];

function VerdictLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <p>
      <span className={ok ? traceStyles.pass : traceStyles.fail}>{ok ? "✓" : "✗"}</span> {label}
    </p>
  );
}

/** Intuition beat: pick which issuer supposedly signed the same claim, and watch the verifier check it
 *  entirely locally — no message goes back to any issuer, only a lookup in a small trusted-issuer list. */
export function IntuitionDemo() {
  const [issuer, setIssuer] = useState(ALL_ISSUERS[0]);
  const cred = issueCredential(issuer, SUBJECT, ISSUED_CLAIM);
  const result = verifyCredential(cred);

  return (
    <>
      <div className={traceStyles.trace}>
        <p>
          <span className={traceStyles.tag}>Credential</span> issuer=&ldquo;{issuer}&rdquo;, subject=&ldquo;{SUBJECT}&rdquo;,
          claim=&ldquo;{ISSUED_CLAIM}&rdquo;, signature=<code>{cred.signature}</code>
        </p>
        <VerdictLine label="signature recomputes correctly from these exact fields" ok={result.signatureValid} />
        <VerdictLine label="issuer appears in the verifier's local trusted-issuer registry" ok={result.issuerTrusted} />
        <p className={traceStyles.final}>
          <span className={result.valid ? traceStyles.pass : traceStyles.fail}>{result.valid ? "✓ Accepted" : "✗ Rejected"}</span>{" "}
          — decided without contacting {issuer} at all.
        </p>
      </div>
      <div className={styles.controls}>
        <div className={styles.buttons}>
          {ALL_ISSUERS.map((i) => (
            <button key={i} type="button" className={i === issuer ? styles.buttonActive : styles.button} onClick={() => setIssuer(i)}>
              {i}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** Play beat: edit the claim being presented and watch the recomputed signature stop matching the one
 *  actually issued — tamper-evidence, checked purely by recomputation, no issuer round-trip needed. */
export function PlayDemo() {
  const [presentedClaim, setPresentedClaim] = useState(ISSUED_CLAIM);
  const candidate = { issuer: "State DMV", subject: SUBJECT, claim: presentedClaim, signature: ORIGINAL.signature };
  const result = verifyCredential(candidate);

  return (
    <>
      <div className={traceStyles.trace}>
        <p>
          Originally issued: claim=&ldquo;{ISSUED_CLAIM}&rdquo;, signature=<code>{ORIGINAL.signature}</code>
        </p>
        <p>
          Now presented: claim=&ldquo;{presentedClaim}&rdquo; → recomputed signature =
          <code> {verifyCredential(candidate).signatureValid ? ORIGINAL.signature : "≠ " + ORIGINAL.signature}</code>
        </p>
        <VerdictLine label="recomputed signature matches the one on the credential" ok={result.signatureValid} />
      </div>
      <div className={styles.controls}>
        <div className={styles.row}>
          <label htmlFor="claim-field">presented claim</label>
          <input
            id="claim-field"
            className={styles.textInput}
            type="text"
            value={presentedClaim}
            onChange={(e) => setPresentedClaim(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

/** Checkpoint: reconstruct the exact (issuer, claim) pair that matches the credential's fixed signature. */
export function DecentralizedIdentityCheckpoint() {
  const [issuer, setIssuer] = useState("Fake Issuer");
  const [claim, setClaim] = useState("over-99");
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const id = useId();

  const candidate = { issuer, subject: SUBJECT, claim, signature: ORIGINAL.signature };
  const result = verifyCredential(candidate);

  useEffect(() => {
    if (result.valid) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [result.valid]);

  return (
    <CheckpointFrame
      instructions={
        <>
          A credential arrives with a fixed signature, <code>{ORIGINAL.signature}</code>. Pick the issuer and
          type the claim that together make this credential verify as valid — both the signature and the
          issuer&rsquo;s trustworthiness have to check out.
        </>
      }
      passed={result.valid || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an issuer and edit the claim to try it"
    >
      <div className={traceStyles.trace}>
        <VerdictLine label="signature recomputes correctly from these exact fields" ok={result.signatureValid} />
        <VerdictLine label="issuer appears in the verifier's local trusted-issuer registry" ok={result.issuerTrusted} />
      </div>
      <div className={styles.controls}>
        <div className={styles.buttons}>
          {ALL_ISSUERS.map((i) => (
            <button
              key={i}
              type="button"
              className={i === issuer ? styles.buttonActive : styles.button}
              onClick={() => {
                setHasInteracted(true);
                setIssuer(i);
              }}
            >
              {i}
            </button>
          ))}
        </div>
        <div className={styles.row}>
          <label htmlFor={id}>claim</label>
          <input
            id={id}
            className={styles.textInput}
            type="text"
            value={claim}
            onChange={(e) => {
              setHasInteracted(true);
              setClaim(e.target.value);
            }}
          />
        </div>
      </div>
    </CheckpointFrame>
  );
}
