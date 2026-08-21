"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { runReAct, LANDMARKS } from "@/lib/math-core/react-reasoning-and-acting";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import traceStyles from "./ReActTrace.module.css";

const CONCEPT_ID = "react-reasoning-and-acting";

function Trace({ landmark }: { landmark: string }) {
  const t = runReAct(landmark);
  return (
    <div className={traceStyles.trace}>
      <p><span className={traceStyles.tag}>Thought 1</span> {t.thought1}</p>
      <p><span className={traceStyles.tag}>Action 1</span> <code>{t.action1}</code></p>
      <p><span className={traceStyles.tag}>Observation 1</span> {t.observation1}</p>
      <p><span className={traceStyles.tag}>Thought 2</span> {t.thought2}</p>
      <p><span className={traceStyles.tag}>Action 2</span> <code>{t.action2}</code></p>
      <p><span className={traceStyles.tag}>Observation 2</span> {t.observation2}</p>
      <p className={traceStyles.final}>Final answer: {t.finalAnswer}</p>
    </div>
  );
}

/** Intuition beat: pick a landmark and step through the full thought-action-observation loop that gets to its capital. */
export function IntuitionDemo() {
  const [landmark, setLandmark] = useState(LANDMARKS[0]);
  return (
    <>
      <div className={styles.buttons}>
        {LANDMARKS.map((l) => (
          <button key={l} type="button" className={l === landmark ? styles.buttonActive : styles.button} onClick={() => setLandmark(l)}>
            {l}
          </button>
        ))}
      </div>
      <Trace landmark={landmark} />
    </>
  );
}

/** Play beat: the naive (uncorrected) answer versus what the loop actually lands on, for every landmark. */
export function PlayDemo() {
  return (
    <div className={traceStyles.trace}>
      {LANDMARKS.map((l) => {
        const t = runReAct(l);
        return (
          <p key={l}>
            <strong>{l}:</strong> naive guess &ldquo;{t.naiveAnswer}&rdquo; → corrected to &ldquo;{t.finalAnswer}&rdquo; after observing {l} is actually in {t.observation1}
          </p>
        );
      })}
    </div>
  );
}

/** Checkpoint: find the landmark whose loop ends on Rome. */
export function ReActCheckpoint() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = chosen !== null && runReAct(chosen).finalAnswer === "Rome";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the landmark, among the three, whose loop ends with the final answer <strong>Rome</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a landmark to try it"
    >
      <div className={styles.buttons}>
        {LANDMARKS.map((l) => (
          <button
            key={l}
            type="button"
            className={l === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(l);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {chosen !== null && <p className={traceStyles.final}>Final answer: {runReAct(chosen).finalAnswer}</p>}
    </CheckpointFrame>
  );
}
