"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  backboneFeature,
  targetPoints,
  transferTrace,
  fromScratchTrace,
  mse,
  HEAD_TRUE_W,
  NEW_TASK_INPUTS,
} from "@/lib/math-core/capstone-fine-tune-a-pretrained-model";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-fine-tune-a-pretrained-model";
const POINTS = targetPoints();
const STEP_OPTIONS = [1, 10, 50];

/** Intuition beat: two raw inputs pass through the frozen backbone into two well-separated features. */
export function IntuitionDemo() {
  const [inputIndex, setInputIndex] = useState(0);
  const x0 = NEW_TASK_INPUTS[inputIndex];
  const feature = backboneFeature(x0);
  return (
    <>
      <div className={styles.buttons}>
        {NEW_TASK_INPUTS.map((x, i) => (
          <button key={x} type="button" className={i === inputIndex ? styles.buttonActive : styles.button} onClick={() => setInputIndex(i)}>
            x₀={x}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "raw input x₀", value: x0 },
          { label: "frozen backbone output", value: feature },
        ]}
        formatValue={(v) => v.toFixed(4)}
        readout={`the backbone never changes — only its output feeds the new task's head`}
      />
    </>
  );
}

/** Play beat: fine-tune just the head at its ideal rate vs training both head parameters from scratch. */
export function PlayDemo() {
  const [steps, setSteps] = useState(10);
  const transfer = transferTrace(0.5, 1, 0, HEAD_TRUE_W, POINTS);
  const scratch = fromScratchTrace(0.05, steps, { w: 0, b: 0 }, POINTS);
  const scratchFinal = scratch[scratch.length - 1];
  return (
    <>
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button key={n} type="button" className={n === steps ? styles.buttonActive : styles.button} onClick={() => setSteps(n)}>
            scratch: {n} steps
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "transfer MSE (1 step)", value: mse(HEAD_TRUE_W, transfer[1], POINTS) },
          { label: `from scratch MSE (${steps} steps)`, value: mse(scratchFinal.w, scratchFinal.b, POINTS) },
        ]}
        formatValue={(v) => v.toFixed(4)}
        readout="the frozen backbone plus a 1-parameter head beats retraining everything, at any step budget shown here"
      />
    </>
  );
}

/** Checkpoint: find the learning rate that explodes joint from-scratch training within 3 steps. */
export function CapstoneCheckpoint() {
  const [rate, setRate] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const rateOptions = [0.01, 0.05, 0.5];

  const scratchFinal = rate === null ? null : fromScratchTrace(rate, 3, { w: 0, b: 0 }, POINTS).at(-1)!;
  const passed = scratchFinal !== null && Math.abs(scratchFinal.w) > 100;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the learning rate, among the three candidates, that makes <strong>from-scratch head training explode</strong> within 3 steps.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a learning rate to try it"
    >
      <div className={styles.buttons}>
        {rateOptions.map((r) => (
          <button
            key={r}
            type="button"
            className={r === rate ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setRate(r);
            }}
          >
            lr={r}
          </button>
        ))}
      </div>
      {scratchFinal !== null && (
        <ContributionBars
          items={[
            { label: "w", value: scratchFinal.w },
            { label: "b", value: scratchFinal.b },
          ]}
          formatValue={(v) => v.toFixed(2)}
        />
      )}
    </CheckpointFrame>
  );
}
