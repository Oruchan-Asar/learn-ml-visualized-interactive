"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  COLUMN_A,
  WORKED_B,
  ON_LINE_B,
  CHECKPOINT_TARGET_P,
  projectOnto,
  residual,
  isSolvable,
} from "@/lib/math-core/matrix-multiplication-as-projection";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const DOMAIN: [number, number] = [-6, 6];
const CONCEPT_ID = "matrix-multiplication-as-projection";
const TOLERANCE = 0.4;

function fmt(v: { x: number; y: number }): string {
  return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
}

/** Intuition beat: drag b, watch its projection p onto the line spanned by the fixed column a. */
export function IntuitionDemo() {
  const [b, setB] = useState(WORKED_B);
  const p = projectOnto(COLUMN_A, b);
  const r = residual(COLUMN_A, b);
  const solvable = isSolvable(COLUMN_A, b);

  return (
    <VectorPlayground
      vectors={[
        { ...COLUMN_A, draggable: false },
        { ...b, draggable: true },
      ]}
      onChangeVector={(i, next) => i === 1 && setB(next)}
      domain={DOMAIN}
      projectedPoints={[p]}
      readout={`a = ${fmt(COLUMN_A)} (the column space, a line)  |  b = ${fmt(b)}  |  p = proj of b onto a = ${fmt(p)}  |  Ax=b exactly solvable: ${solvable ? "yes" : "no"}  |  residual·a = ${(COLUMN_A.x * r.x + COLUMN_A.y * r.y).toFixed(6)}`}
    />
  );
}

const PRESETS = [
  { key: "off", label: "b off the line", point: WORKED_B },
  { key: "on", label: "b on the line", point: ON_LINE_B },
] as const;

/** Play beat: jump between a b that's off the column space and one that's exactly on it. */
export function PlayDemo() {
  const [b, setB] = useState<{ x: number; y: number }>(WORKED_B);
  const [presetKey, setPresetKey] = useState<string>("off");
  const p = projectOnto(COLUMN_A, b);
  const r = residual(COLUMN_A, b);
  const solvable = isSolvable(COLUMN_A, b);

  return (
    <>
      <VectorPlayground
        vectors={[
          { ...COLUMN_A, draggable: false },
          { ...b, draggable: true },
        ]}
        onChangeVector={(i, next) => i === 1 && setB(next)}
        domain={DOMAIN}
        projectedPoints={[p]}
        readout={`p = ${fmt(p)}  |  residual r = b - p = ${fmt(r)}  |  |r| = ${Math.hypot(r.x, r.y).toFixed(3)}`}
      />
      <div className={styles.buttons}>
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={preset.key === presetKey ? styles.buttonActive : styles.button}
            onClick={() => {
              setPresetKey(preset.key);
              setB(preset.point);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p>Ax = b exactly solvable: <strong>{solvable ? "yes" : "no"}</strong></p>
    </>
  );
}

/** Checkpoint: drag b until its projection p lands on the fixed target point (4, 2). */
export function ProjectionCheckpoint() {
  const [b, setB] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const p = projectOnto(COLUMN_A, b);
  const passed = withinDistance(p, CHECKPOINT_TARGET_P, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag <strong>b</strong> until its projection <code>p</code> onto the line spanned by{" "}
          <strong>a = {fmt(COLUMN_A)}</strong> lands on <strong>{fmt(CHECKPOINT_TARGET_P)}</strong>.
          Any b that projects there will do — there&apos;s more than one right answer.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag b to try it"
    >
      <VectorPlayground
        vectors={[
          { ...COLUMN_A, draggable: false },
          { ...b, draggable: true },
        ]}
        onChangeVector={(i, next) => {
          if (i !== 1) return;
          setHasInteracted(true);
          setB(next);
        }}
        domain={DOMAIN}
        passed={passed}
        projectedPoints={[p]}
        readout={`p = ${fmt(p)}`}
      />
    </CheckpointFrame>
  );
}
