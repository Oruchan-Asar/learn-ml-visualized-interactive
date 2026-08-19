"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { apply, ROTATE_90, SCALE, FLIP_X, SHEAR, type Mat2 } from "@/lib/math-core/matrices";
import type { Vec2 } from "@/lib/math-core/vectors";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./MatrixControls.module.css";

const DOMAIN: [number, number] = [-6, 6];
const START_V: Vec2 = { x: 3, y: 2 };
const CONCEPT_ID = "matrices-as-transformations";
const CHECKPOINT_TARGET: Vec2 = { x: 4, y: 3 };
const TOLERANCE = 0.5;

function matrixLabel(m: Mat2): string {
  return `[[${m.a}, ${m.b}], [${m.c}, ${m.d}]]`;
}

/** Intuition beat: a fixed 90° rotation — just watch Mv track v as you drag. */
export function IntuitionDemo() {
  const [v, setV] = useState(START_V);
  const mv = apply(ROTATE_90, v);
  return (
    <VectorPlayground
      vectors={[
        { ...v, draggable: true },
        { ...mv, draggable: false },
      ]}
      onChangeVector={(i, next) => i === 0 && setV(next)}
      domain={DOMAIN}
      readout={`v = (${v.x.toFixed(1)}, ${v.y.toFixed(1)})  →  Mv = (${mv.x.toFixed(1)}, ${mv.y.toFixed(1)})`}
    />
  );
}

const PRESETS = [
  { key: "rotate", label: "Rotate 90°", matrix: ROTATE_90 },
  { key: "scale", label: "Scale", matrix: SCALE },
  { key: "flip", label: "Flip", matrix: FLIP_X },
  { key: "shear", label: "Shear", matrix: SHEAR },
] as const;

function MatrixPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className={styles.presetRow}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          className={p.key === value ? styles.presetButtonActive : styles.presetButton}
          onClick={() => onChange(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/** Play beat: pick a preset matrix, drag v, watch Mv change character entirely. */
export function PlayDemo() {
  const [v, setV] = useState(START_V);
  const [presetKey, setPresetKey] = useState<string>("rotate");
  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0];
  const mv = apply(preset.matrix, v);
  return (
    <>
      <VectorPlayground
        vectors={[
          { ...v, draggable: true },
          { ...mv, draggable: false },
        ]}
        onChangeVector={(i, next) => i === 0 && setV(next)}
        domain={DOMAIN}
        readout={`M = ${matrixLabel(preset.matrix)}  →  Mv = (${mv.x.toFixed(1)}, ${mv.y.toFixed(1)})`}
      />
      <MatrixPicker value={presetKey} onChange={setPresetKey} />
    </>
  );
}

/** Checkpoint: fixed 90° rotation — drag v until Mv lands on a target point. */
export function MatrixCheckpoint() {
  const [v, setV] = useState(START_V);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const mv = apply(ROTATE_90, v);
  const passed = withinDistance(mv, CHECKPOINT_TARGET, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag <strong>v</strong> until <code>Mv</code> lands on <strong>(4, 3)</strong>, using the 90°
          rotation matrix.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag v to try it"
    >
      <VectorPlayground
        vectors={[
          { ...v, draggable: true },
          { ...mv, draggable: false },
        ]}
        onChangeVector={(i, next) => {
          if (i !== 0) return;
          setHasInteracted(true);
          setV(next);
        }}
        domain={DOMAIN}
        passed={passed}
        readout={`Mv = (${mv.x.toFixed(1)}, ${mv.y.toFixed(1)})`}
      />
    </CheckpointFrame>
  );
}
