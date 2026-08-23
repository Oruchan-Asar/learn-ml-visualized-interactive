"use client";

import { useEffect, useId, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import type { Mat2 } from "@/lib/math-core/matrices";
import {
  determinant,
  inverse,
  MATRIX_A,
  SINGULAR_MATRIX,
  CHECKPOINT_MATRIX,
} from "@/lib/math-core/determinants-and-matrix-inversion";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import { ParallelogramArea } from "./ParallelogramArea";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "determinants-and-matrix-inversion";

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>
        {label} = {value}
      </label>
      <input id={id} type="range" min={-3} max={3} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function inverseLabel(m: Mat2): string {
  const inv = inverse(m);
  if (!inv) return "no inverse — matrix is singular";
  const fmt = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(2));
  return `[[${fmt(inv.a)}, ${fmt(inv.b)}], [${fmt(inv.c)}, ${fmt(inv.d)}]]`;
}

/** Intuition beat: sliders for a,b,c,d, watching the unit square's image and det update live. */
export function IntuitionDemo() {
  const [m, setM] = useState<Mat2>(MATRIX_A);
  const det = determinant(m);

  return (
    <>
      <ParallelogramArea matrix={m} />
      <Slider label="a" value={m.a} onChange={(a) => setM({ ...m, a })} />
      <Slider label="b" value={m.b} onChange={(b) => setM({ ...m, b })} />
      <Slider label="c" value={m.c} onChange={(c) => setM({ ...m, c })} />
      <Slider label="d" value={m.d} onChange={(d) => setM({ ...m, d })} />
      <p>
        M = [[{m.a}, {m.b}], [{m.c}, {m.d}]] &nbsp; det(M) = {det}
      </p>
    </>
  );
}

/** Play beat: same sliders, now also reading off the inverse (or "no inverse" once det hits 0). */
export function PlayDemo() {
  const [m, setM] = useState<Mat2>(MATRIX_A);
  const det = determinant(m);

  return (
    <>
      <ParallelogramArea matrix={m} />
      <Slider label="a" value={m.a} onChange={(a) => setM({ ...m, a })} />
      <Slider label="b" value={m.b} onChange={(b) => setM({ ...m, b })} />
      <Slider label="c" value={m.c} onChange={(c) => setM({ ...m, c })} />
      <Slider label="d" value={m.d} onChange={(d) => setM({ ...m, d })} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setM(MATRIX_A)}>
          reset to invertible
        </button>
        <button type="button" className={styles.button} onClick={() => setM(SINGULAR_MATRIX)}>
          jump to singular
        </button>
      </div>
      <p>
        det(M) = {det} &nbsp; M⁻¹ = {inverseLabel(m)}
      </p>
    </>
  );
}

const CANDIDATES = [2, 8, -2, 14];

/** Checkpoint: pick the correct determinant of a fixed matrix from four plausible candidates. */
export function DeterminantCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const correct = determinant(CHECKPOINT_MATRIX);
  const passed = chosen === correct;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          For M = [[{CHECKPOINT_MATRIX.a}, {CHECKPOINT_MATRIX.b}], [{CHECKPOINT_MATRIX.c}, {CHECKPOINT_MATRIX.d}]],
          compute det(M) by hand and pick it below.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <ParallelogramArea matrix={CHECKPOINT_MATRIX} />
      <div className={styles.buttons}>
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
