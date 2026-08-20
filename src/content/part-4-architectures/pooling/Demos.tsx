"use client";

import { useEffect, useId, useState } from "react";
import { PoolingPlayground } from "@/components/viz/PoolingPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  FEATURE_MAP,
  POOL_SIZE,
  STRIDE,
  OUTPUT_SIZE,
  MAX_POOLED,
  AVG_POOLED,
  maxPoolAt,
  avgPoolAt,
} from "@/lib/math-core/pooling";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "pooling";
const MAX_VALUE = Math.max(...FEATURE_MAP.flat());

type Mode = "max" | "avg";

function ModeButtons({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className={styles.buttons}>
      <button
        type="button"
        className={mode === "max" ? styles.buttonActive : styles.button}
        onClick={() => onChange("max")}
      >
        Max pooling
      </button>
      <button
        type="button"
        className={mode === "avg" ? styles.buttonActive : styles.button}
        onClick={() => onChange("avg")}
      >
        Average pooling
      </button>
    </div>
  );
}

function PositionSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>
        {label} = {value}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={OUTPUT_SIZE - 1}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: same fixed window, toggle max vs average pooling to feel the difference. */
export function IntuitionDemo() {
  const [mode, setMode] = useState<Mode>("max");
  const row = 0;
  const col = 0;
  const pooled = mode === "max" ? MAX_POOLED : AVG_POOLED;
  const value = mode === "max" ? maxPoolAt(row, col) : avgPoolAt(row, col);
  return (
    <>
      <PoolingPlayground
        featureMap={FEATURE_MAP}
        poolSize={POOL_SIZE}
        stride={STRIDE}
        pooled={pooled}
        outputRow={row}
        outputCol={col}
        maxValue={MAX_VALUE}
        readout={`output (${row}, ${col}) — ${mode === "max" ? "max" : "average"} = ${value}`}
      />
      <div className={styles.controls}>
        <ModeButtons mode={mode} onChange={setMode} />
      </div>
    </>
  );
}

/** Play beat: move the window over both windows, in both modes. */
export function PlayDemo() {
  const [mode, setMode] = useState<Mode>("max");
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const pooled = mode === "max" ? MAX_POOLED : AVG_POOLED;
  const value = mode === "max" ? maxPoolAt(row, col) : avgPoolAt(row, col);
  return (
    <>
      <PoolingPlayground
        featureMap={FEATURE_MAP}
        poolSize={POOL_SIZE}
        stride={STRIDE}
        pooled={pooled}
        outputRow={row}
        outputCol={col}
        maxValue={MAX_VALUE}
        readout={`output (${row}, ${col}) — ${mode === "max" ? "max" : "average"} = ${value}`}
      />
      <div className={styles.controls}>
        <ModeButtons mode={mode} onChange={setMode} />
        <PositionSlider label="row" value={row} onChange={setRow} />
        <PositionSlider label="col" value={col} onChange={setCol} />
      </div>
    </>
  );
}

/** Checkpoint: find the window and pooling mode that surfaces the feature map's strongest detection. */
export function PoolingCheckpoint() {
  const [mode, setMode] = useState<Mode>("avg");
  const [row, setRow] = useState(1);
  const [col, setCol] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const pooled = mode === "max" ? MAX_POOLED : AVG_POOLED;
  const value = mode === "max" ? maxPoolAt(row, col) : avgPoolAt(row, col);

  const passed = mode === "max" && value === MAX_VALUE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Choose a window and a pooling mode that reveals the feature map&rsquo;s strongest detection,{" "}
          <strong>{MAX_VALUE}</strong>, exactly.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move a control to try it"
    >
      <PoolingPlayground
        featureMap={FEATURE_MAP}
        poolSize={POOL_SIZE}
        stride={STRIDE}
        pooled={pooled}
        outputRow={row}
        outputCol={col}
        maxValue={MAX_VALUE}
        readout={`output (${row}, ${col}) — ${mode === "max" ? "max" : "average"} = ${value}`}
      />
      <div className={styles.controls}>
        <ModeButtons
          mode={mode}
          onChange={(m) => {
            setHasInteracted(true);
            setMode(m);
          }}
        />
        <PositionSlider
          label="row"
          value={row}
          onChange={(v) => {
            setHasInteracted(true);
            setRow(v);
          }}
        />
        <PositionSlider
          label="col"
          value={col}
          onChange={(v) => {
            setHasInteracted(true);
            setCol(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
