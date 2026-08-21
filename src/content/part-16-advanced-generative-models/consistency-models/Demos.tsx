"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { positionAt } from "@/lib/math-core/flow-matching";
import { consistencyFunction, CANDIDATES, PAIRS } from "@/lib/math-core/consistency-models";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "consistency-models";
const PAIR_LABELS = PAIRS.map((p) => `(${p.x0}, ${p.x1})`);

const PATH_CURVE: CurveLine = {
  points: Array.from({ length: 21 }, (_, k) => ({ x: k / 20, y: positionAt(k / 20, PAIRS[0]) })),
  variant: "fit",
};

/** Intuition beat: drag t anywhere along one trajectory and watch the consistency function always jump straight to the same endpoint. */
export function IntuitionDemo() {
  const [t, setT] = useState(0.3);
  const pair = PAIRS[0];
  const xt = positionAt(t, pair);
  const output = consistencyFunction(t, pair);

  return (
    <>
      <MultiCurvePlayground
        curves={[PATH_CURVE]}
        domain={[0, 1]}
        rangeDomain={[-3, 6]}
        scatterPoints={[
          { x: t, y: xt },
          { x: 1, y: output },
        ]}
        readout={`x_t = ${xt.toFixed(3)} at t = ${t.toFixed(2)} → f(x_t, t) = ${output.toFixed(3)} — one jump, straight to the endpoint`}
      />
      <label className={styles.sliderRow}>
        t
        <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
        {t.toFixed(2)}
      </label>
    </>
  );
}

/** Play beat: five wildly different starting points on the same trajectory, all mapped by the same function to the same output. */
export function PlayDemo() {
  const ts = [0.05, 0.25, 0.5, 0.75, 0.95];
  return (
    <ContributionBars
      items={ts.map((t) => ({ label: `t = ${t}`, value: consistencyFunction(t, PAIRS[0]) }))}
      formatValue={(v) => v.toFixed(4)}
      readout="every bar is exactly the same height — self-consistency means it doesn't matter where on the trajectory you start"
    />
  );
}

/** Checkpoint: find the candidate (t, trajectory) whose consistency output is negative. */
export function ConsistencyCheckpoint() {
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chosenOutput = chosenIndex === null ? null : consistencyFunction(CANDIDATES[chosenIndex].t, PAIRS[CANDIDATES[chosenIndex].pairIndex]);
  const passed = chosenOutput !== null && chosenOutput < 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the candidate, among the three, whose consistency-function output is <strong>negative</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a candidate to try it"
    >
      <div className={styles.buttons}>
        {CANDIDATES.map((c, i) => (
          <button
            key={i}
            type="button"
            className={i === chosenIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosenIndex(i);
            }}
          >
            t = {c.t}, trajectory {PAIR_LABELS[c.pairIndex]}
          </button>
        ))}
      </div>
      {chosenOutput !== null && <ContributionBars items={[{ label: "f(x_t, t)", value: chosenOutput }]} formatValue={(v) => v.toFixed(2)} />}
    </CheckpointFrame>
  );
}
