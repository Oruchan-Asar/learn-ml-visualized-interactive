"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { researchAgent, correctHandoff, brokenHandoff, TOPICS } from "@/lib/math-core/multi-agent-orchestration";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import handoffStyles from "./Handoff.module.css";

const CONCEPT_ID = "multi-agent-orchestration";

/** Intuition beat: pick a topic and see the correct handoff versus the broken one, side by side. */
export function IntuitionDemo() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const result = researchAgent(topic);

  return (
    <>
      <div className={styles.buttons}>
        {TOPICS.map((t) => (
          <button key={t} type="button" className={t === topic ? styles.buttonActive : styles.button} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className={handoffStyles.trace}>
        <p className={handoffStyles.label}>Research agent returns:</p>
        <code>{JSON.stringify(result)}</code>
        <p className={handoffStyles.label}>Correct handoff (writer receives result.fact):</p>
        <p className={handoffStyles.good}>{correctHandoff(topic)}</p>
        <p className={handoffStyles.label}>Broken handoff (writer receives the whole result object):</p>
        <p className={handoffStyles.bad}>{brokenHandoff(topic)}</p>
      </div>
    </>
  );
}

/** Play beat: every topic's broken handoff — the exact same failure, regardless of what the underlying fact was. */
export function PlayDemo() {
  return (
    <div className={handoffStyles.trace}>
      {TOPICS.map((t) => (
        <p key={t} className={handoffStyles.bad}>
          {brokenHandoff(t)}
        </p>
      ))}
    </div>
  );
}

/** Checkpoint: find the topic whose correctly-handed-off sentence mentions rings. */
export function OrchestrationCheckpoint() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = chosen !== null && correctHandoff(chosen).includes("ring");

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the topic, among the three, whose correctly-written sentence mentions <strong>rings</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a topic to try it"
    >
      <div className={styles.buttons}>
        {TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            className={t === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {chosen !== null && <p className={handoffStyles.good}>{correctHandoff(chosen)}</p>}
    </CheckpointFrame>
  );
}
