"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { PAIRS, PRINCIPLE, violatesPrinciple, critique, revise } from "@/lib/math-core/constitutional-ai-and-rlaif";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import ciStyles from "./Critique.module.css";

const CONCEPT_ID = "constitutional-ai-and-rlaif";

/** Intuition beat: pick a response pair and watch the AI critic (not a human) label the preferred one. */
export function IntuitionDemo() {
  const [pairIndex, setPairIndex] = useState(0);
  const pair = PAIRS[pairIndex];
  const result = critique(pair);

  return (
    <>
      <div className={styles.buttons}>
        {PAIRS.map((_, i) => (
          <button key={i} type="button" className={i === pairIndex ? styles.buttonActive : styles.button} onClick={() => setPairIndex(i)}>
            pair {i + 1}
          </button>
        ))}
      </div>
      <div className={ciStyles.trace}>
        <p className={result.winner === "a" ? ciStyles.chosen : ciStyles.rejected}>A: {pair.a}</p>
        <p className={result.winner === "b" ? ciStyles.chosen : ciStyles.rejected}>B: {pair.b}</p>
        <p className={ciStyles.reason}>Critic: {result.reason}</p>
      </div>
    </>
  );
}

/** Play beat: self-revision — a violating response, redacted without needing a second response to compare against at all. */
export function PlayDemo() {
  return (
    <div className={ciStyles.trace}>
      {PAIRS.flatMap((pair) => [pair.a, pair.b])
        .filter(violatesPrinciple)
        .map((response, i) => (
          <div key={i}>
            <p className={ciStyles.rejected}>Before: {response}</p>
            <p className={ciStyles.chosen}>After: {revise(response)}</p>
          </div>
        ))}
    </div>
  );
}

/** Checkpoint: find the response, among four candidates, that violates the principle. */
export function ConstitutionalCheckpoint() {
  const candidates = [
    "The weather today is sunny with a chance of rain.",
    "Your password is hunter2 — write it down somewhere safe.",
    "I'd be happy to help you reset your password securely.",
    "Passwords should be at least 12 characters long.",
  ];
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = chosen !== null && violatesPrinciple(chosen);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>The principle is: &ldquo;{PRINCIPLE}&rdquo; Find the response, among the four, that <strong>violates</strong> it.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a response to try it"
    >
      <div className={ciStyles.candidateList}>
        {candidates.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? ciStyles.candidateActive : ciStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {chosen !== null && <p className={violatesPrinciple(chosen) ? ciStyles.rejected : ciStyles.chosen}>{violatesPrinciple(chosen) ? "Violates the principle" : "Does not violate the principle"}</p>}
    </CheckpointFrame>
  );
}
