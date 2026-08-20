"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { transferTrace, fromScratchTrace, mse, PRETRAINED_W } from "@/lib/math-core/transfer-learning-and-fine-tuning";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "transfer-learning-and-fine-tuning";
const STEP_OPTIONS = [1, 5, 20];

/** Intuition beat: same step budget, one approach freezes the pretrained slope, the other retrains everything. */
export function IntuitionDemo() {
  const [steps, setSteps] = useState(5);
  const transfer = transferTrace(0.1, steps);
  const scratch = fromScratchTrace(0.1, steps);
  const transferFinal = transfer[transfer.length - 1];
  const scratchFinal = scratch[scratch.length - 1];
  return (
    <>
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button key={n} type="button" className={n === steps ? styles.buttonActive : styles.button} onClick={() => setSteps(n)}>
            {n} steps
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "transfer: MSE", value: mse(PRETRAINED_W, transferFinal) },
          { label: "from scratch: MSE", value: mse(scratchFinal.w, scratchFinal.b) },
        ]}
        formatValue={(v) => v.toFixed(4)}
        readout={`after ${steps} steps at lr=0.1: transfer only ever had to learn one number`}
      />
    </>
  );
}

/** Play beat: transfer's ideal rate solves it in one step; the same rate wrecks from-scratch training. */
export function PlayDemo() {
  const transferIdeal = transferTrace(0.5, 1);
  const scratchAtSameRate = fromScratchTrace(0.5, 3);
  const scratchFinal = scratchAtSameRate[scratchAtSameRate.length - 1];
  return (
    <ContributionBars
      items={[
        { label: "transfer @ lr=0.5, 1 step: MSE", value: mse(PRETRAINED_W, transferIdeal[1]) },
        { label: "from scratch @ lr=0.5, 3 steps: w", value: scratchFinal.w },
        { label: "from scratch @ lr=0.5, 3 steps: b", value: scratchFinal.b },
      ]}
      formatValue={(v) => v.toFixed(2)}
      readout="the exact rate that solves transfer's one-parameter problem instantly explodes the two-parameter one"
    />
  );
}

const RATE_OPTIONS = [0.05, 0.1, 0.5];

/** Checkpoint: find the learning rate that causes from-scratch joint training to explode. */
export function TransferLearningCheckpoint() {
  const [rate, setRate] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const scratchFinal = rate === null ? null : fromScratchTrace(rate, 3).at(-1)!;
  const passed = scratchFinal !== null && Math.abs(scratchFinal.w) > 100;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the learning rate, among the three candidates, that makes <strong>from-scratch training explode</strong> after just 3 steps.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a learning rate to try it"
    >
      <div className={styles.buttons}>
        {RATE_OPTIONS.map((r) => (
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
            { label: "from-scratch w", value: scratchFinal.w },
            { label: "from-scratch b", value: scratchFinal.b },
          ]}
          formatValue={(v) => v.toFixed(2)}
        />
      )}
    </CheckpointFrame>
  );
}
