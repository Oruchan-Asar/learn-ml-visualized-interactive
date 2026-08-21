"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GRADIENTS,
  LR,
  runTraining,
  SHOWN_SEEDS,
  CHECKPOINT_SEEDS,
  CHECKPOINT_TARGET_FINAL_WEIGHT,
} from "@/lib/math-core/experiment-tracking-and-reproducibility";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import traceStyles from "./Trace.module.css";

const CONCEPT_ID = "experiment-tracking-and-reproducibility";

/** Intuition beat: pick a seed, keep everything else — lr, gradients, initial weight — fixed, and watch the noise sequence (and the final weight) change. */
export function IntuitionDemo() {
  const [seed, setSeed] = useState(SHOWN_SEEDS[0]);
  const run = runTraining(seed);

  return (
    <>
      <div className={styles.buttons}>
        {[1, 2, 3, 4].map((s) => (
          <button key={s} type="button" className={s === seed ? styles.buttonActive : styles.button} onClick={() => setSeed(s)}>
            seed {s}
          </button>
        ))}
      </div>
      <div className={traceStyles.trace}>
        <div className={traceStyles.row}>
          <span className={traceStyles.rowHeader}>step</span>
          <span className={traceStyles.rowHeader}>gradient</span>
          <span className={traceStyles.rowHeader}>noise</span>
          <span className={traceStyles.rowHeader}>w before</span>
          <span className={traceStyles.rowHeader}>w after</span>
        </div>
        {run.trace.map((t) => (
          <div key={t.step} className={traceStyles.row}>
            <span>{t.step}</span>
            <span>{t.gradient}</span>
            <span>{t.noise}</span>
            <span>{t.weightBefore}</span>
            <span>{t.weightAfter}</span>
          </div>
        ))}
        <p>
          lr={run.lr}, gradients={GRADIENTS.join(", ")} — identical for every seed. Final weight:{" "}
          <span className={traceStyles.final}>{run.finalWeight}</span>
        </p>
      </div>
    </>
  );
}

/** Play beat: the two runs side by side — same logged hyperparameters, different unlogged seed, different outcome. */
export function PlayDemo() {
  const runs = SHOWN_SEEDS.map((s) => runTraining(s));

  return (
    <div className={traceStyles.compare}>
      {runs.map((run) => (
        <div key={run.seed} className={traceStyles.runCard}>
          <p>
            <strong>seed {run.seed}</strong>
          </p>
          <p>lr = {run.lr}</p>
          <p>gradients = [{GRADIENTS.join(", ")}]</p>
          <p>
            final weight = <span className={traceStyles.final}>{run.finalWeight}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

/** Checkpoint: a run's logged config (lr, gradients) matches every candidate seed — find which one actually reproduces the logged final weight. */
export function ReproCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = chosen !== null && runTraining(chosen).finalWeight === CHECKPOINT_TARGET_FINAL_WEIGHT;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          A logged experiment reports lr={LR}, the same gradient schedule, and a final weight of{" "}
          <strong>{CHECKPOINT_TARGET_FINAL_WEIGHT}</strong> — but the seed wasn&apos;t recorded. Find the seed that reproduces
          it.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a seed to try it"
    >
      <div className={traceStyles.candidateList}>
        {CHECKPOINT_SEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={s === chosen ? traceStyles.candidateActive : traceStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(s);
            }}
          >
            seed {s}
          </button>
        ))}
      </div>
      {chosen !== null && <p>seed {chosen} → final weight {runTraining(chosen).finalWeight}</p>}
    </CheckpointFrame>
  );
}
