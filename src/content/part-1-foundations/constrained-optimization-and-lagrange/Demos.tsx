"use client";

import { useEffect, useId, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  f,
  pointOnConstraint,
  alignmentError,
  impliedLambdaFromX,
  impliedLambdaFromY,
  DOMAIN,
  ALIGNMENT_TOLERANCE,
} from "@/lib/math-core/constrained-optimization-and-lagrange";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import { LagrangeDiagram } from "./LagrangeDiagram";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "constrained-optimization-and-lagrange";

function XSlider({ value, onChange }: { value: number; onChange: (x: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>x = {value.toFixed(2)} (y = {(4 - value).toFixed(2)})</label>
      <input
        id={id}
        type="range"
        min={DOMAIN[0]}
        max={DOMAIN[1]}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: slide along the constraint line and watch the level circle grow and shrink as you go. */
export function IntuitionDemo() {
  const [x, setX] = useState(0);
  const p = pointOnConstraint(x);
  return (
    <>
      <LagrangeDiagram x={p.x} y={p.y} />
      <div className={styles.controls}>
        <XSlider value={x} onChange={setX} />
      </div>
    </>
  );
}

/** Play beat: same slider, now with the alignment error and implied λ read out live. */
export function PlayDemo() {
  const [x, setX] = useState(0);
  const p = pointOnConstraint(x);
  const err = alignmentError(p.x, p.y);
  const aligned = Math.abs(err) < ALIGNMENT_TOLERANCE;

  return (
    <>
      <LagrangeDiagram x={p.x} y={p.y} passed={aligned} />
      <div className={styles.controls} style={{ flexDirection: "column", alignItems: "flex-start" }}>
        <p>
          f(x,y) = {f(p.x, p.y).toFixed(2)} — alignment error (∂f/∂x − ∂f/∂y) = {err.toFixed(2)}
          {aligned ? " — parallel! this is the constrained optimum" : ""}
        </p>
        <p>
          λ implied by x: {impliedLambdaFromX(p.x).toFixed(2)}, λ implied by y: {impliedLambdaFromY(p.y).toFixed(2)}
        </p>
        <XSlider value={x} onChange={setX} />
      </div>
    </>
  );
}

/** Checkpoint: slide until ∇f is parallel to ∇g — the accent and ink arrows point the same way. */
export function LagrangeCheckpoint() {
  const [x, setX] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const p = pointOnConstraint(x);
  const err = alignmentError(p.x, p.y);
  const passed = withinTolerance(err, 0, ALIGNMENT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide the point along the constraint line until <code>∇f</code> is parallel to{" "}
          <code>∇g</code> — the accent arrow lines up with the dashed constraint arrow.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the slider to try it"
    >
      <LagrangeDiagram x={p.x} y={p.y} passed={passed} />
      <div className={styles.controls}>
        <XSlider
          value={x}
          onChange={(next) => {
            setHasInteracted(true);
            setX(next);
          }}
        />
        <span className={styles.stepCount}>alignment error = {err.toFixed(2)}</span>
      </div>
    </CheckpointFrame>
  );
}
