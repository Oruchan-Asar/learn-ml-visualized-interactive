"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { FLIPS, headsCount, mleEstimate, logLikelihood } from "@/lib/math-core/maximum-likelihood-estimation";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import flipStyles from "./Flips.module.css";

const CONCEPT_ID = "maximum-likelihood-estimation";
const MLE = mleEstimate(FLIPS);
const HEADS = headsCount(FLIPS);
const CURVE_POINTS = Array.from({ length: 19 }, (_, i) => {
  const p = 0.05 + i * 0.05;
  return { x: p, y: logLikelihood(p, FLIPS) };
});

function FlipsRow() {
  return (
    <div className={flipStyles.flips}>
      {FLIPS.map((f, i) => (
        <span key={i} className={f === 1 ? flipStyles.heads : flipStyles.tails}>
          {f === 1 ? "H" : "T"}
        </span>
      ))}
    </div>
  );
}

function PSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className={styles.sliderRow}>
      candidate p
      <input type="range" min={0.05} max={0.95} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {value.toFixed(2)}
    </label>
  );
}

/** Intuition beat: drag a candidate p and watch the log-likelihood curve's current point move with it. */
export function IntuitionDemo() {
  const [p, setP] = useState(0.5);
  const ll = logLikelihood(p, FLIPS);
  return (
    <>
      <FlipsRow />
      <MultiCurvePlayground
        curves={[{ points: CURVE_POINTS, variant: "fitHighlight" }]}
        domain={[0.05, 0.95]}
        rangeDomain={[-13, -2]}
        scatterPoints={[{ x: p, y: ll }]}
        readout={`log-likelihood(p=${p.toFixed(2)}) = ${ll.toFixed(3)}`}
      />
      <PSlider value={p} onChange={setP} />
    </>
  );
}

/** Play beat: same curve, now also reporting the exact MLE for direct comparison. */
export function PlayDemo() {
  const [p, setP] = useState(0.5);
  const ll = logLikelihood(p, FLIPS);
  const llAtMle = logLikelihood(MLE, FLIPS);
  return (
    <>
      <FlipsRow />
      <MultiCurvePlayground
        curves={[{ points: CURVE_POINTS, variant: "fitHighlight" }]}
        domain={[0.05, 0.95]}
        rangeDomain={[-13, -2]}
        scatterPoints={[{ x: p, y: ll }]}
        readout={`p=${p.toFixed(2)}: log-likelihood = ${ll.toFixed(3)} (MLE p=${MLE.toFixed(2)} scores ${llAtMle.toFixed(3)}, the best possible)`}
      />
      <PSlider value={p} onChange={setP} />
    </>
  );
}

const TOLERANCE = 0.03;

/** Checkpoint: drag p until it lands on the actual MLE — the log-likelihood's true maximizer. */
export function MleCheckpoint() {
  const [p, setP] = useState(0.5);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = withinTolerance(p, MLE, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          {HEADS} heads out of {FLIPS.length} flips. Drag <code>p</code> until it lands on the maximum
          likelihood estimate.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <FlipsRow />
      <MultiCurvePlayground
        curves={[{ points: CURVE_POINTS, variant: "fitHighlight" }]}
        domain={[0.05, 0.95]}
        rangeDomain={[-13, -2]}
        scatterPoints={[{ x: p, y: logLikelihood(p, FLIPS) }]}
        readout={`log-likelihood(p=${p.toFixed(2)}) = ${logLikelihood(p, FLIPS).toFixed(3)}`}
      />
      <PSlider
        value={p}
        onChange={(v) => {
          setHasInteracted(true);
          setP(v);
        }}
      />
    </CheckpointFrame>
  );
}
