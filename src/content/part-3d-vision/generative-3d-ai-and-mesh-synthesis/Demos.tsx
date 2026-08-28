"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { scaleLinear } from "d3";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import {
  chamferDistance,
  refinementTrace,
  refinementAt,
  chamferAt,
  TARGET_SHAPE,
  REFINEMENT_STEPS,
  CHECKPOINT_TARGET_CHAMFER,
  CHECKPOINT_TOLERANCE,
  type Point2D,
} from "@/lib/math-core/generative-3d-ai-and-mesh-synthesis";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "generative-3d-ai-and-mesh-synthesis";
const DOMAIN: [number, number] = [-1, 3];
const SIZE = 220;
const MAX_CHAMFER = chamferDistance(REFINEMENT_STEPS[0], TARGET_SHAPE);

function closedPath(points: Point2D[], scaleX: (v: number) => number, scaleY: (v: number) => number): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`).join(" ") + " Z";
}

/** A small point cloud (filled dots, solid outline) overlaid on the fixed target shape (hollow rings, dashed outline). */
function ShapeView({ points, readout }: { points: Point2D[]; readout?: string }) {
  const scaleX = useMemo(() => scaleLinear().domain(DOMAIN).range([20, SIZE - 20]), []);
  const scaleY = useMemo(() => scaleLinear().domain(DOMAIN).range([SIZE - 20, 20]), []);

  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "8px 4px 4px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", maxWidth: 240, height: "auto" }} role="img" aria-label="A point cloud being refined toward a target square shape.">
        <path d={closedPath(TARGET_SHAPE, scaleX, scaleY)} fill="none" stroke="var(--ink-faint)" strokeWidth={1.5} strokeDasharray="4 3" />
        {TARGET_SHAPE.map((p, i) => (
          <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={5} fill="none" stroke="var(--ink-faint)" strokeWidth={1.5} />
        ))}
        <path d={closedPath(points, scaleX, scaleY)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={6} fill="var(--accent)" />
        ))}
      </svg>
      {readout && <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-soft)", textAlign: "center", padding: "6px 0 10px" }}>{readout}</div>}
    </div>
  );
}

/** Intuition beat: step through the 3 discrete refinement steps, watching the point cloud close in on the target square. No formula shown yet. */
export function IntuitionDemo() {
  const [step, setStep] = useState(0);
  const trace = refinementTrace();
  const points = REFINEMENT_STEPS[step];
  const fidelity = Math.max(0, 1 - trace[step] / MAX_CHAMFER);

  return (
    <>
      <ShapeView points={points} readout={`chamfer distance = ${trace[step].toFixed(3)}`} />
      <ContributionBars items={[{ label: "fidelity", value: fidelity }]} max={1} formatValue={(v) => v.toFixed(2)} />
      <div className={styles.controls}>
        <span className={styles.stepCount}>
          step {step + 1} of {REFINEMENT_STEPS.length}
        </span>
      </div>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          ← coarser
        </button>
        <button type="button" className={styles.button} disabled={step === REFINEMENT_STEPS.length - 1} onClick={() => setStep((s) => Math.min(REFINEMENT_STEPS.length - 1, s + 1))}>
          finer →
        </button>
      </div>
    </>
  );
}

/** Play beat: a continuous refinement slider t, linked to the chamfer-distance formula. */
export function PlayDemo() {
  const [t, setT] = useState(0);
  const points = refinementAt(t);
  const chamfer = chamferAt(t);
  const fidelity = Math.max(0, 1 - chamfer / MAX_CHAMFER);

  return (
    <>
      <ShapeView points={points} readout={`chamfer(t=${t.toFixed(2)}) = ${chamfer.toFixed(3)}`} />
      <ContributionBars
        items={[{ label: "fidelity = 1 - chamfer/chamfer(0)", value: fidelity }]}
        max={1}
        formatValue={(v) => v.toFixed(2)}
        readout={`chamfer falls off linearly: 2(1-t)√2 = ${chamfer.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label>refinement t: {t.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </div>
      </div>
    </>
  );
}

/** Checkpoint: drag the refinement slider until chamfer distance drops to the target. */
export function GenerativeCheckpoint() {
  const id = useId();
  const [t, setT] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chamfer = chamferAt(t);
  const passed = withinTolerance(chamfer, CHECKPOINT_TARGET_CHAMFER, CHECKPOINT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const points = refinementAt(t);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the refinement slider until the point cloud&apos;s chamfer distance to the target drops to{" "}
          <strong>≈ {CHECKPOINT_TARGET_CHAMFER}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <ShapeView points={points} readout={`chamfer = ${chamfer.toFixed(3)}`} />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label htmlFor={id}>refinement t: {t.toFixed(2)}</label>
          <input
            id={id}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={t}
            onChange={(e) => {
              setHasInteracted(true);
              setT(Number(e.target.value));
            }}
          />
        </div>
      </div>
    </CheckpointFrame>
  );
}
