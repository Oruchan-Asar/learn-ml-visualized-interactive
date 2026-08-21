"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { DOUBLE_DEMOS, NEGATE_DEMOS, QUERY_X, inContextAnswer } from "@/lib/math-core/prompting-and-in-context-learning";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "prompting-and-in-context-learning";
const PROMPTS = [
  { label: '"double" demos', demos: DOUBLE_DEMOS },
  { label: '"negate" demos', demos: NEGATE_DEMOS },
];

/** Intuition beat: swap which demonstrations are in the prompt and watch the frozen mechanism's answer change. */
export function IntuitionDemo() {
  const [promptIndex, setPromptIndex] = useState(0);
  const prompt = PROMPTS[promptIndex];
  const result = inContextAnswer(prompt.demos, QUERY_X);
  return (
    <>
      <div className={styles.buttons}>
        {PROMPTS.map((p, i) => (
          <button key={p.label} type="button" className={i === promptIndex ? styles.buttonActive : styles.button} onClick={() => setPromptIndex(i)}>
            {p.label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={prompt.demos.map((d, i) => ({ label: `(${d.x}, ${d.y})`, value: result.weights[i] }))}
        formatValue={(v) => v.toFixed(3)}
        readout={`query x=${QUERY_X} → answer = ${result.answer.toFixed(3)} — no weights changed, only the prompt did`}
      />
    </>
  );
}

/** Play beat: both prompts, same query, same attention weights, opposite-signed answers. */
export function PlayDemo() {
  const double = inContextAnswer(DOUBLE_DEMOS, QUERY_X);
  const negate = inContextAnswer(NEGATE_DEMOS, QUERY_X);
  return (
    <ContributionBars
      items={[
        { label: '"double" demos → answer', value: double.answer },
        { label: '"negate" demos → answer', value: negate.answer },
      ]}
      formatValue={(v) => v.toFixed(3)}
      readout={`identical attention weights [${double.weights.map((w) => w.toFixed(2)).join(", ")}] in both cases — only the demonstrated outputs differ`}
    />
  );
}

/** Checkpoint: find the prompt that steers the query toward a NEGATIVE answer. */
export function ICLCheckpoint() {
  const [promptIndex, setPromptIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const answer = promptIndex === null ? null : inContextAnswer(PROMPTS[promptIndex].demos, QUERY_X).answer;
  const passed = answer !== null && answer < 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the prompt, between the two candidates, that steers the query toward a <strong>negative</strong> answer.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a prompt to try it"
    >
      <div className={styles.buttons}>
        {PROMPTS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            className={i === promptIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setPromptIndex(i);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {answer !== null && <ContributionBars items={[{ label: "answer", value: answer }]} formatValue={(v) => v.toFixed(3)} />}
    </CheckpointFrame>
  );
}
