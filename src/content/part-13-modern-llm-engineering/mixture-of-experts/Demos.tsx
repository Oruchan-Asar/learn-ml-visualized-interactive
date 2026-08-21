"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { EXPERTS, route } from "@/lib/math-core/mixture-of-experts";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "mixture-of-experts";
const TOKEN_VALUES = [2, -2, 0.5];

/** Intuition beat: pick a token and see which two of the four experts actually run. */
export function IntuitionDemo() {
  const [tokenIndex, setTokenIndex] = useState(0);
  const x = TOKEN_VALUES[tokenIndex];
  const result = route(x);
  return (
    <>
      <div className={styles.buttons}>
        {TOKEN_VALUES.map((v, i) => (
          <button key={v} type="button" className={i === tokenIndex ? styles.buttonActive : styles.button} onClick={() => setTokenIndex(i)}>
            token = {v}
          </button>
        ))}
      </div>
      <ContributionBars
        items={EXPERTS.map((_, i) => ({ label: result.expertOutputs[i] === null ? `expert ${i} (not run)` : `expert ${i}`, value: result.expertOutputs[i] ?? 0 }))}
        formatValue={(v) => v.toFixed(2)}
        readout={`token ${x} routes to experts {${result.selectedIndices.join(", ")}} — output = ${result.output.toFixed(3)}`}
      />
    </>
  );
}

/** Play beat: two very different tokens, two completely different pairs of active experts. */
export function PlayDemo() {
  const r2 = route(2);
  const rNeg2 = route(-2);
  return (
    <>
      <ContributionBars
        items={EXPERTS.map((_, i) => ({ label: r2.expertOutputs[i] === null ? `expert ${i} (not run)` : `expert ${i}`, value: r2.expertOutputs[i] ?? 0 }))}
        formatValue={(v) => v.toFixed(2)}
        readout={`token=2 → experts {${r2.selectedIndices.join(", ")}}`}
      />
      <ContributionBars
        items={EXPERTS.map((_, i) => ({ label: rNeg2.expertOutputs[i] === null ? `expert ${i} (not run)` : `expert ${i}`, value: rNeg2.expertOutputs[i] ?? 0 }))}
        formatValue={(v) => v.toFixed(2)}
        readout={`token=-2 → experts {${rNeg2.selectedIndices.join(", ")}} — no overlap with token=2's experts`}
      />
    </>
  );
}

/** Checkpoint: find the token that routes to expert 1. */
export function MoECheckpoint() {
  const [tokenIndex, setTokenIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const result = tokenIndex === null ? null : route(TOKEN_VALUES[tokenIndex]);
  const passed = result !== null && result.selectedIndices.includes(1);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the token, among the three candidates, that routes to <strong>expert 1</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a token to try it"
    >
      <div className={styles.buttons}>
        {TOKEN_VALUES.map((v, i) => (
          <button
            key={v}
            type="button"
            className={i === tokenIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setTokenIndex(i);
            }}
          >
            token = {v}
          </button>
        ))}
      </div>
      {result && (
        <ContributionBars
          items={EXPERTS.map((_, i) => ({ label: result.expertOutputs[i] === null ? `expert ${i} (not run)` : `expert ${i}`, value: result.expertOutputs[i] ?? 0 }))}
          formatValue={(v) => v.toFixed(2)}
          readout={`routes to experts {${result.selectedIndices.join(", ")}}`}
        />
      )}
    </CheckpointFrame>
  );
}
