"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { logisticScore, logisticScoreDerivative } from "@/lib/math-core/logistic";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./WeightControls.module.css";

const DOMAIN: [number, number] = [-2, 12];
const CONCEPT_ID = "logistic-regression-and-the-sigmoid";
const CHECK_X = 5;
const TARGET_PROBABILITY = 0.5;
const TOLERANCE = 0.05;

function WeightSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={styles.sliderRow}>
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {value.toFixed(2)}
    </label>
  );
}

/** Intuition beat: fixed w,b — just drag along the curve, no sliders yet. */
export function IntuitionDemo() {
  const w = 1;
  const b = -5;
  const [x, setX] = useState(2);
  return (
    <CurvePlayground
      fn={(x) => logisticScore(w, b, x)}
      derivative={(x) => logisticScoreDerivative(w, b, x)}
      domain={DOMAIN}
      value={x}
      onChange={setX}
    />
  );
}

/** Play beat: sliders for w and b, plus the draggable point, with z and P read out live. */
export function PlayDemo() {
  const [w, setW] = useState(1);
  const [b, setB] = useState(-5);
  const [x, setX] = useState(2);
  const z = w * x + b;
  const p = logisticScore(w, b, x);
  return (
    <>
      <CurvePlayground
        fn={(x) => logisticScore(w, b, x)}
        derivative={(x) => logisticScoreDerivative(w, b, x)}
        domain={DOMAIN}
        value={x}
        onChange={setX}
        readout={`z = ${w.toFixed(2)}(${x.toFixed(1)}) + (${b.toFixed(2)}) = ${z.toFixed(2)}  →  P = ${p.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <WeightSlider label="w" value={w} min={0.2} max={3} step={0.1} onChange={setW} />
        <WeightSlider label="b" value={b} min={-15} max={15} step={0.5} onChange={setB} />
      </div>
    </>
  );
}

/** Checkpoint: balance w and b so the decision boundary (P=0.5) lands at x=5. */
export function SigmoidCheckpoint() {
  const [w, setW] = useState(1);
  const [b, setB] = useState(-2);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const p = logisticScore(w, b, CHECK_X);
  const passed = withinTolerance(p, TARGET_PROBABILITY, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Balance <code>w</code> and <code>b</code> until the decision boundary — where{" "}
          <code>P = 0.5</code> — lands exactly at <strong>x = 5</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move a slider to try it"
    >
      <CurvePlayground
        fn={(x) => logisticScore(w, b, x)}
        derivative={(x) => logisticScoreDerivative(w, b, x)}
        domain={DOMAIN}
        value={CHECK_X}
        onChange={() => {}}
        passed={passed}
        readout={`P(x = 5) = ${p.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <WeightSlider
          label="w"
          value={w}
          min={0.2}
          max={3}
          step={0.1}
          onChange={(v) => {
            setHasInteracted(true);
            setW(v);
          }}
        />
        <WeightSlider
          label="b"
          value={b}
          min={-15}
          max={15}
          step={0.5}
          onChange={(v) => {
            setHasInteracted(true);
            setB(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
