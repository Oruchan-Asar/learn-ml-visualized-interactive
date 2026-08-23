"use client";

import { useEffect, useState } from "react";
import { TokenChips } from "@/components/viz/TokenChips";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { EXAMPLES, runInduction, type Token } from "@/lib/math-core/circuit-tracing-and-induction-heads";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "circuit-tracing-and-induction-heads";

function attentionItems(sequence: Token[]) {
  const { weights, positions } = runInduction(sequence);
  return positions.map((pos, i) => ({ label: `position ${pos} ("${sequence[pos]}")`, value: weights[i] }));
}

/** Intuition beat: pick a sequence and see which earlier position the induction head attends to when predicting what comes next. */
export function IntuitionDemo() {
  const [index, setIndex] = useState(0);
  const example = EXAMPLES[index];
  const { predicted } = runInduction(example.sequence);

  return (
    <>
      <div className={styles.buttons}>
        {EXAMPLES.map((ex, i) => (
          <button key={ex.label} type="button" className={i === index ? styles.buttonActive : styles.button} onClick={() => setIndex(i)}>
            {ex.label}
          </button>
        ))}
      </div>
      <TokenChips tokens={[...example.sequence, "?"]} />
      <ContributionBars items={attentionItems(example.sequence)} formatValue={(v) => v.toFixed(2)} max={1} readout={`predicted next token: ${predicted}`} />
    </>
  );
}

/** Play beat: every example's confidence (max attention weight) and prediction, side by side. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={EXAMPLES.map((ex) => {
        const { predicted, maxWeight } = runInduction(ex.sequence);
        return { label: `${ex.label} → predicts ${predicted}`, value: maxWeight };
      })}
      formatValue={(v) => v.toFixed(2)}
      max={1}
      readout="a repeated token gives the head a clean earlier match — a fully novel one leaves it with no match at all, and the weight falls back to uniform"
    />
  );
}

/** Checkpoint: find the sequence, among the four, where the induction head is LEAST confident. */
export function InductionCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const weights = EXAMPLES.map((ex) => runInduction(ex.sequence).maxWeight);
  const minWeight = Math.min(...weights);
  const passed = chosen !== null && weights[chosen] === minWeight;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Find the sequence, among the four, where the induction head is <strong>least confident</strong> in its prediction.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a sequence to try it"
    >
      <div className={styles.buttons}>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.label}
            type="button"
            className={i === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(i);
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>
      {chosen !== null && <ContributionBars items={[{ label: "max attention weight", value: weights[chosen] }]} formatValue={(v) => v.toFixed(2)} max={1} />}
    </CheckpointFrame>
  );
}
