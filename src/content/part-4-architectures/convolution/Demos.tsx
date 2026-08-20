"use client";

import { useEffect, useId, useState } from "react";
import { ConvolutionPlayground } from "@/components/viz/ConvolutionPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { IMAGE, KERNEL_SIZE, FEATURE_MAP, FEATURE_MAP_SIZE, MAX_RESPONSE, convolveAt } from "@/lib/math-core/convolution";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "convolution";

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
        max={FEATURE_MAP_SIZE - 1}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: slide the kernel window across the image, watch the response light up right at the edge. */
export function IntuitionDemo() {
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const response = convolveAt(row, col);
  return (
    <>
      <ConvolutionPlayground
        image={IMAGE}
        kernelSize={KERNEL_SIZE}
        featureMap={FEATURE_MAP}
        windowRow={row}
        windowCol={col}
        maxResponse={MAX_RESPONSE}
        readout={`window at (${row}, ${col}) — response = ${response}`}
      />
      <div className={styles.controls}>
        <PositionSlider label="row" value={row} onChange={setRow} />
        <PositionSlider label="col" value={col} onChange={setCol} />
      </div>
    </>
  );
}

/** Play beat: same control — notice the response only ever depends on the column, never the row. */
export function PlayDemo() {
  const [row, setRow] = useState(2);
  const [col, setCol] = useState(0);
  const response = convolveAt(row, col);
  return (
    <>
      <ConvolutionPlayground
        image={IMAGE}
        kernelSize={KERNEL_SIZE}
        featureMap={FEATURE_MAP}
        windowRow={row}
        windowCol={col}
        maxResponse={MAX_RESPONSE}
        readout={`window at (${row}, ${col}) — response = ${response}`}
      />
      <div className={styles.controls}>
        <PositionSlider label="row" value={row} onChange={setRow} />
        <PositionSlider label="col" value={col} onChange={setCol} />
      </div>
    </>
  );
}

/** Checkpoint: find a window position where the filter's response is as strong as possible. */
export function ConvolutionCheckpoint() {
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const response = convolveAt(row, col);

  const passed = response === MAX_RESPONSE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide the window to a position where the filter&rsquo;s response reaches its maximum,{" "}
          <strong>{MAX_RESPONSE}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move a slider to try it"
    >
      <ConvolutionPlayground
        image={IMAGE}
        kernelSize={KERNEL_SIZE}
        featureMap={FEATURE_MAP}
        windowRow={row}
        windowCol={col}
        maxResponse={MAX_RESPONSE}
        readout={`window at (${row}, ${col}) — response = ${response}`}
      />
      <div className={styles.controls}>
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
