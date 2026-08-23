"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ContributionBars } from "@/components/viz/ContributionBars";
import {
  COVARIANCE,
  INDEFINITE_MATRIX,
  SNAP_ANGLES,
  CHECKPOINT_ANGLE,
  quadraticForm,
  unitVectorAtAngle,
} from "@/lib/math-core/positive-semi-definite-matrices-and-covariance";
import type { Mat2 } from "@/lib/math-core/matrices";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "positive-semi-definite-matrices-and-covariance";

function anglesToBars(m: Mat2) {
  return SNAP_ANGLES.map((deg) => ({ label: `${deg}°`, value: quadraticForm(m, unitVectorAtAngle(deg)) }));
}

const MATRICES = [
  { key: "covariance", label: "covariance C = [[5,3],[3,5]]", matrix: COVARIANCE },
  { key: "indefinite", label: "not-PSD M = [[1,2],[2,1]]", matrix: INDEFINITE_MATRIX },
] as const;

/** Intuition beat: toggle between a real covariance matrix (always non-negative) and one that isn't PSD. */
export function IntuitionDemo() {
  const [key, setKey] = useState<string>("covariance");
  const selected = MATRICES.find((m) => m.key === key) ?? MATRICES[0];
  const bars = anglesToBars(selected.matrix);
  const allNonNegative = bars.every((b) => b.value >= 0);

  return (
    <>
      <div className={styles.buttons}>
        {MATRICES.map((m) => (
          <button key={m.key} type="button" className={m.key === key ? styles.buttonActive : styles.button} onClick={() => setKey(m.key)}>
            {m.label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={bars}
        max={8}
        readout={`v^T M v at each direction — ${allNonNegative ? "never goes negative: this matrix is PSD" : "dips negative: this matrix is NOT PSD"}`}
      />
    </>
  );
}

/** Play beat: both matrices' quadratic forms side by side, across every 45-degree direction. */
export function PlayDemo() {
  return (
    <>
      {MATRICES.map((m) => (
        <div key={m.key}>
          <p>
            <strong>{m.label}</strong>
          </p>
          <ContributionBars items={anglesToBars(m.matrix)} max={8} />
        </div>
      ))}
    </>
  );
}

const CANDIDATE_ANGLES = [0, 45, 90, 135];

/** Checkpoint: click the direction where the non-PSD matrix's quadratic form goes negative. */
export function PSDCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen === CHECKPOINT_ANGLE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          M = [[1,2],[2,1]] is symmetric but NOT positive semi-definite. Compute v<sup>T</sup>Mv by hand at
          each candidate direction and click the one where it goes <strong>negative</strong> — that&apos;s
          your proof.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an angle to try it"
    >
      <div className={styles.buttons}>
        {CANDIDATE_ANGLES.map((deg) => (
          <button
            key={deg}
            type="button"
            className={deg === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(deg);
            }}
          >
            {deg}°
          </button>
        ))}
      </div>
      {chosen !== null && (
        <p>
          v = unit vector at {chosen}° → v^T M v = {quadraticForm(INDEFINITE_MATRIX, unitVectorAtAngle(chosen)).toFixed(2)}
        </p>
      )}
    </CheckpointFrame>
  );
}
