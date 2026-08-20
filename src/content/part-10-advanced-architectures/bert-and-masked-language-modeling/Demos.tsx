"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TOKENS, bidirectionalPrediction, causalPrediction, squaredError, maskedToken } from "@/lib/math-core/bert-and-masked-language-modeling";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "bert-and-masked-language-modeling";
const MODES = ["causal (left-only)", "bidirectional"] as const;

/** Intuition beat: toggle between a causal model and a bidirectional one predicting the same masked word. */
export function IntuitionDemo() {
  const [mode, setMode] = useState<(typeof MODES)[number]>("causal (left-only)");
  const truth = maskedToken();
  const predicted = mode === "causal (left-only)" ? causalPrediction() : bidirectionalPrediction();
  const error = squaredError(predicted, truth);
  return (
    <>
      <div className={styles.buttons}>
        {MODES.map((m) => (
          <button key={m} type="button" className={m === mode ? styles.buttonActive : styles.button} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "predicted x", value: predicted.x },
          { label: "predicted y", value: predicted.y },
          { label: "true x (cat)", value: truth.x },
          { label: "true y (cat)", value: truth.y },
        ]}
        formatValue={(v) => v.toFixed(2)}
        readout={`squared error = ${error.toFixed(2)}`}
      />
    </>
  );
}

/** Play beat: "the [MASK] sat" — the sentence with its middle word hidden, both predictions side by side. */
export function PlayDemo() {
  const truth = maskedToken();
  const causal = causalPrediction();
  const bi = bidirectionalPrediction();
  return (
    <ContributionBars
      items={[
        { label: "causal error (sees only 'the')", value: squaredError(causal, truth) },
        { label: "bidirectional error (sees 'the' + 'sat')", value: squaredError(bi, truth) },
      ]}
      formatValue={(v) => v.toFixed(2)}
      readout={`"the ${TOKENS[1].label} sat" — masking the middle word, reconstructing it from context alone`}
    />
  );
}

/** Checkpoint: find which attention mode achieves the lower reconstruction error on the masked word. */
export function BertCheckpoint() {
  const [mode, setMode] = useState<(typeof MODES)[number] | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const truth = maskedToken();
  const error = mode === null ? null : squaredError(mode === "causal (left-only)" ? causalPrediction() : bidirectionalPrediction(), truth);
  const passed = mode === "bidirectional";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the attention mode that achieves the <strong>lower reconstruction error</strong> on the masked word.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a mode to try it"
    >
      <div className={styles.buttons}>
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={m === mode ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setMode(m);
            }}
          >
            {m}
          </button>
        ))}
      </div>
      {error !== null && <ContributionBars items={[{ label: "squared error", value: error }]} formatValue={(v) => v.toFixed(2)} />}
    </CheckpointFrame>
  );
}
