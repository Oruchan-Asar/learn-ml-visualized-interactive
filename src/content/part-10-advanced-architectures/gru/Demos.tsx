"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { gruSequence, gruGradientProduct } from "@/lib/math-core/gru";
import { rnnGradientProduct, lstmGradientProduct } from "@/lib/math-core/vanishing-gradients-rnns-lstms";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "gru";
const STEP_OPTIONS = [3, 6, 10];

/** Intuition beat: step through the sequence and watch the hidden state build up slowly but never reset. */
export function IntuitionDemo() {
  const [steps, setSteps] = useState(10);
  const seq = gruSequence(steps);
  const curve: CurveLine = { points: seq.map((s, i) => ({ x: i + 1, y: s.h })), variant: "fitHighlight" };
  const last = seq[seq.length - 1];
  return (
    <>
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button key={n} type="button" className={n === steps ? styles.buttonActive : styles.button} onClick={() => setSteps(n)}>
            {n} steps
          </button>
        ))}
      </div>
      <MultiCurvePlayground
        curves={[curve]}
        domain={[1, steps]}
        rangeDomain={[0, Math.max(0.2, last.h)]}
        readout={`update gate z ≈ ${last.z.toFixed(4)} every step — reset gate r ≈ ${last.r.toFixed(4)}, h after ${steps} steps = ${last.h.toFixed(4)}`}
      />
    </>
  );
}

/** Play beat: the same 10-step gradient story as the LSTM chapter, now with a GRU added to the comparison. */
export function PlayDemo() {
  const seq = gruSequence(10);
  const gruGrad = gruGradientProduct(10, seq[0].z);
  const lstmGrad = lstmGradientProduct(10, 0.9);
  const rnnGrad = rnnGradientProduct(10, 0.9);
  return (
    <ContributionBars
      items={[
        { label: "plain RNN", value: rnnGrad },
        { label: "LSTM (forget=0.9)", value: lstmGrad },
        { label: "GRU (update≈0.018)", value: gruGrad },
      ]}
      formatValue={(v) => v.toExponential(2)}
      readout="one gate cheaper than the LSTM, and — with this bias — an even stronger memory highway"
    />
  );
}

/** Checkpoint: find the step count at which the GRU's gradient has dropped below the LSTM's. */
export function GRUCheckpoint() {
  const [steps, setSteps] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const z = gruSequence(1)[0].z;
  const gruGrad = steps === null ? null : gruGradientProduct(steps, z);
  const lstmGrad = steps === null ? null : lstmGradientProduct(steps, 0.9);
  const passed = gruGrad !== null && lstmGrad !== null && gruGrad > lstmGrad;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find a step count, among the three candidates, where the <strong>GRU&apos;s</strong> surviving gradient is still bigger than the <strong>LSTM&apos;s</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a step count to try it"
    >
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={n === steps ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setSteps(n);
            }}
          >
            {n} steps
          </button>
        ))}
      </div>
      {gruGrad !== null && lstmGrad !== null && (
        <ContributionBars
          items={[
            { label: "GRU gradient", value: gruGrad },
            { label: "LSTM gradient", value: lstmGrad },
          ]}
          formatValue={(v) => v.toFixed(4)}
        />
      )}
    </CheckpointFrame>
  );
}
