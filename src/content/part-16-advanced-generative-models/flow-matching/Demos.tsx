"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { positionAt, velocity, euler, PAIRS } from "@/lib/math-core/flow-matching";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "flow-matching";
const PAIR_LABELS = PAIRS.map((p) => `(${p.x0}, ${p.x1})`);

const PATH_CURVES: CurveLine[] = PAIRS.map((pair, i) => ({
  points: Array.from({ length: 21 }, (_, k) => ({ x: k / 20, y: positionAt(k / 20, pair) })),
  variant: i === 0 ? "fitHighlight" : "fit",
}));

/** Intuition beat: drag t along a pair's straight-line path and watch position move at a constant rate. */
export function IntuitionDemo() {
  const [pairIndex, setPairIndex] = useState(0);
  const [t, setT] = useState(0.5);
  const pair = PAIRS[pairIndex];

  return (
    <>
      <div className={styles.buttons}>
        {PAIR_LABELS.map((label, i) => (
          <button key={label} type="button" className={i === pairIndex ? styles.buttonActive : styles.button} onClick={() => setPairIndex(i)}>
            (x0, x1) = {label}
          </button>
        ))}
      </div>
      <MultiCurvePlayground
        curves={[PATH_CURVES[pairIndex]]}
        domain={[0, 1]}
        rangeDomain={[-10, 6]}
        scatterPoints={[{ x: t, y: positionAt(t, pair) }]}
        readout={`x_t = ${positionAt(t, pair).toFixed(3)} at t = ${t.toFixed(2)} — velocity = ${velocity(pair)} (same at every t)`}
      />
      <label className={styles.sliderRow}>
        t
        <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
        {t.toFixed(2)}
      </label>
    </>
  );
}

/** Play beat: generate with a single giant Euler step versus fifty tiny ones — a straight-line path makes the two identical. */
export function PlayDemo() {
  const pair = PAIRS[0];
  return (
    <ContributionBars
      items={[
        { label: "1 giant step", value: euler(pair, 1) },
        { label: "50 tiny steps", value: euler(pair, 50) },
      ]}
      formatValue={(v) => v.toFixed(4)}
      readout={`both land on x1 = ${pair.x1} exactly — no discretization error to trade off, because the true path has no curvature to miss`}
    />
  );
}

/** Checkpoint: find the pair whose position at t=0.5 is negative. */
export function FlowMatchingCheckpoint() {
  const [pairIndex, setPairIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chosenMidpoint = pairIndex === null ? null : positionAt(0.5, PAIRS[pairIndex]);
  const passed = chosenMidpoint !== null && chosenMidpoint < 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the (x0, x1) pair, among the three candidates, whose position at <strong>t = 0.5</strong> is <strong>negative</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a pair to try it"
    >
      <div className={styles.buttons}>
        {PAIR_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={i === pairIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setPairIndex(i);
            }}
          >
            (x0, x1) = {label}
          </button>
        ))}
      </div>
      {chosenMidpoint !== null && <ContributionBars items={[{ label: "position at t=0.5", value: chosenMidpoint }]} formatValue={(v) => v.toFixed(2)} />}
    </CheckpointFrame>
  );
}
