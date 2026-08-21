"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { REQUESTS, keywordFilter, jailbreakSucceeded } from "@/lib/math-core/jailbreaks-and-red-teaming";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import jbStyles from "./Filter.module.css";

const CONCEPT_ID = "jailbreaks-and-red-teaming";

/** Intuition beat: pick a request and see whether the keyword filter catches it, plus whether it actually asked for the restricted content. */
export function IntuitionDemo() {
  const [index, setIndex] = useState(0);
  const request = REQUESTS[index];
  const blocked = keywordFilter(request.text);

  return (
    <>
      <div className={styles.buttons}>
        {REQUESTS.map((_, i) => (
          <button key={i} type="button" className={i === index ? styles.buttonActive : styles.button} onClick={() => setIndex(i)}>
            request {i + 1}
          </button>
        ))}
      </div>
      <div className={jbStyles.trace}>
        <p>{request.text}</p>
        <p className={blocked ? jbStyles.blocked : jbStyles.allowed}>Filter: {blocked ? "BLOCKED" : "ALLOWED"}</p>
        <p className={jbStyles.meta}>Actually asks for the restricted content: {request.isRestrictedIntent ? "yes" : "no"}</p>
        {jailbreakSucceeded(request) && <p className={jbStyles.blocked}>Jailbreak succeeded — restricted intent, filter missed it.</p>}
      </div>
    </>
  );
}

/** Play beat: every request's filter verdict versus its true intent, side by side. */
export function PlayDemo() {
  return (
    <div className={jbStyles.trace}>
      {REQUESTS.map((r, i) => (
        <p key={i} className={jailbreakSucceeded(r) ? jbStyles.blocked : jbStyles.meta}>
          request {i + 1}: filter says {keywordFilter(r.text) ? "blocked" : "allowed"}, actually restricted: {r.isRestrictedIntent ? "yes" : "no"}
          {jailbreakSucceeded(r) ? " — jailbreak succeeded" : ""}
        </p>
      ))}
    </div>
  );
}

/** Checkpoint: find the one request, among the four, where the jailbreak actually succeeded. */
export function JailbreakCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = chosen !== null && jailbreakSucceeded(REQUESTS[chosen]);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the request, among the four, where the jailbreak <strong>actually succeeded</strong> — it asks for the restricted content, but the filter let it through.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a request to try it"
    >
      <div className={jbStyles.candidateList}>
        {REQUESTS.map((r, i) => (
          <button
            key={i}
            type="button"
            className={i === chosen ? jbStyles.candidateActive : jbStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(i);
            }}
          >
            {r.text}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <p className={jailbreakSucceeded(REQUESTS[chosen]) ? jbStyles.blocked : jbStyles.allowed}>
          Filter: {keywordFilter(REQUESTS[chosen].text) ? "blocked" : "allowed"} — restricted: {REQUESTS[chosen].isRestrictedIntent ? "yes" : "no"}
        </p>
      )}
    </CheckpointFrame>
  );
}
