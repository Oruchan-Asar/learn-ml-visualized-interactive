"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  CLEAN_TRAJECTORY,
  NOISE_TRAJECTORY,
  TOTAL_STEPS,
  waypointsAtStep,
  errorAtStep,
  CHECKPOINT_STEP,
  CHECKPOINT_WAYPOINT_INDEX,
} from "@/lib/math-core/diffusion-policies-for-manipulation";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import diffStyles from "./Diffusion.module.css";

const CONCEPT_ID = "diffusion-policies-for-manipulation";
const DOMAIN: [number, number] = [-4, 4];
const TOLERANCE = 0.35;

function StepControls({ step, onStep, onReset }: { step: number; onStep: () => void; onReset: () => void }) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={styles.buttonPrimary} onClick={onStep} disabled={step >= TOTAL_STEPS}>
        Denoise one step
      </button>
      <button type="button" className={styles.button} onClick={onReset}>
        Reset to noise
      </button>
    </div>
  );
}

/** Intuition beat: step the whole trajectory from pure noise toward the clean path, one denoising step at a time. */
export function IntuitionDemo() {
  const [step, setStep] = useState(0);
  const waypoints = waypointsAtStep(step);

  return (
    <>
      <StepControls step={step} onStep={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))} onReset={() => setStep(0)} />
      <VectorPlayground
        vectors={waypoints.map((w) => ({ x: w.x, y: w.y, draggable: false }))}
        cloudPoints={CLEAN_TRAJECTORY}
        domain={DOMAIN}
        size={280}
      />
      <div className={diffStyles.readout}>
        <p>
          Step {step} of {TOTAL_STEPS} — the three arrows are the current waypoints, the three dots are the clean
          trajectory they're denoising toward.
        </p>
        <p>Total distance from clean: {errorAtStep(step).toFixed(2)}</p>
      </div>
    </>
  );
}

/** Play beat: the exact denoising error at every step, from pure noise down to zero. */
export function PlayDemo() {
  const steps = Array.from({ length: TOTAL_STEPS + 1 }, (_, i) => i);
  return (
    <div className={diffStyles.table}>
      <div className={diffStyles.row}>
        <span className={diffStyles.rowHeader}>step</span>
        <span className={diffStyles.rowHeader}>fraction denoised</span>
        <span className={diffStyles.rowHeader}>distance from clean</span>
      </div>
      {steps.map((s) => (
        <div className={diffStyles.row} key={s}>
          <span>
            {s} of {TOTAL_STEPS}
          </span>
          <span>{((s / TOTAL_STEPS) * 100).toFixed(0)}%</span>
          <span>{errorAtStep(s).toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}

/** Checkpoint: drag the middle waypoint to where it lands at an unseen denoising step. */
export function DiffusionCheckpoint() {
  const [vector, setVector] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const target = waypointsAtStep(CHECKPOINT_STEP)[CHECKPOINT_WAYPOINT_INDEX];
  const passed = withinDistance(vector, target, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          The middle waypoint starts at noise ({NOISE_TRAJECTORY[CHECKPOINT_WAYPOINT_INDEX].x},{" "}
          {NOISE_TRAJECTORY[CHECKPOINT_WAYPOINT_INDEX].y}) and denoises toward clean (
          {CLEAN_TRAJECTORY[CHECKPOINT_WAYPOINT_INDEX].x}, {CLEAN_TRAJECTORY[CHECKPOINT_WAYPOINT_INDEX].y}). Drag it to
          where it lands at step {CHECKPOINT_STEP} of {TOTAL_STEPS}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the arrow's tip to try it"
    >
      <VectorPlayground
        vectors={[{ x: vector.x, y: vector.y, draggable: true }]}
        cloudPoints={CLEAN_TRAJECTORY}
        onChangeVector={(_, next) => {
          setHasInteracted(true);
          setVector(next);
        }}
        domain={DOMAIN}
        size={280}
        passed={passed}
        readout={`current: (${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`}
      />
    </CheckpointFrame>
  );
}
