"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  f,
  gradientF,
  HESSIAN,
  F,
  jacobian,
  determinant2,
  toGrid,
  isPositiveDefinite2,
} from "@/lib/math-core/jacobians-and-hessians";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const DOMAIN: [number, number] = [-4, 4];
const START = { x: 2, y: 3 };
const CONCEPT_ID = "jacobians-and-hessians";

/** Intuition beat: drag the point and watch the Jacobian of F change from cell to cell. */
export function IntuitionDemo() {
  const [p, setP] = useState(START);
  const j = jacobian(p.x, p.y);
  return (
    <div className={styles.controls} style={{ flexDirection: "column", alignItems: "flex-start" }}>
      <ContourPlayground
        fn={f}
        gradient={gradientF}
        domain={DOMAIN}
        value={p}
        onChange={setP}
        readout={`F(x,y) = (${F(p.x, p.y).x.toFixed(1)}, ${F(p.x, p.y).y.toFixed(1)})`}
      />
      <KernelHeatmap kernel={toGrid(j)} label="Jacobian of F at this point" width={120} />
    </div>
  );
}

/** Play beat: same drag, now with the Jacobian's determinant and the (constant) Hessian side by side. */
export function PlayDemo() {
  const [p, setP] = useState(START);
  const j = jacobian(p.x, p.y);
  const det = determinant2(j);

  return (
    <div className={styles.controls} style={{ flexDirection: "column", alignItems: "flex-start" }}>
      <ContourPlayground
        fn={f}
        gradient={gradientF}
        domain={DOMAIN}
        value={p}
        onChange={setP}
        readout={`∇f = (${gradientF(p.x, p.y).x.toFixed(1)}, ${gradientF(p.x, p.y).y.toFixed(1)})`}
      />
      <div className={styles.buttons} style={{ flexWrap: "wrap" }}>
        <KernelHeatmap kernel={toGrid(j)} label={`Jacobian of F, det = ${det.toFixed(1)}`} width={120} />
        <KernelHeatmap kernel={toGrid(HESSIAN)} label="Hessian of f (constant everywhere)" width={120} />
      </div>
      <p>
        {isPositiveDefinite2(HESSIAN)
          ? "Hessian is positive definite — f curves upward in every direction, a genuine bowl."
          : "Hessian is not positive definite here."}
      </p>
    </div>
  );
}

const CANDIDATES = [15, 16, 10, 1];
const CHECKPOINT_POINT = { x: 1, y: 4 };
const CORRECT_DET = determinant2(jacobian(CHECKPOINT_POINT.x, CHECKPOINT_POINT.y));

/** Checkpoint: compute det(J) of F at a fixed point and pick it out from plausible wrong answers. */
export function JacobianCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen === CORRECT_DET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const j = jacobian(CHECKPOINT_POINT.x, CHECKPOINT_POINT.y);

  return (
    <CheckpointFrame
      instructions={
        <>
          At the point <strong>(1, 4)</strong>, compute the determinant of the Jacobian of{" "}
          <code>F(x,y) = (x² + y, x + y²)</code>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Compute det(J), then pick a value"
    >
      <KernelHeatmap kernel={toGrid(j)} label="Jacobian of F at (1, 4)" width={120} />
      <div className={styles.buttons} style={{ marginTop: 12 }}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
