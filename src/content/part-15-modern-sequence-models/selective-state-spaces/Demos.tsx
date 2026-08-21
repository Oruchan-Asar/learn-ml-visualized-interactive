"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { SEQUENCE, fixedStep, selectiveStep, runBoth } from "@/lib/math-core/selective-state-spaces";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "selective-state-spaces";
const FULL = runBoth();

function useBothSteps() {
  const [fixed, setFixed] = useState<number[]>([0]);
  const [selective, setSelective] = useState<number[]>([0]);

  const stepForward = () => {
    setFixed((prev) => {
      const t = prev.length - 1;
      if (t >= SEQUENCE.length) return prev;
      return [...prev, fixedStep(prev[prev.length - 1], SEQUENCE[t])];
    });
    setSelective((prev) => {
      const t = prev.length - 1;
      if (t >= SEQUENCE.length) return prev;
      return [...prev, selectiveStep(prev[prev.length - 1], SEQUENCE[t])];
    });
  };
  const reset = () => {
    setFixed([0]);
    setSelective([0]);
  };

  const t = fixed.length - 1;
  return { t, fixed, selective, stepForward, reset };
}

/** Intuition beat: step through the same sequence with both rules at once and watch them diverge on filler. */
export function IntuitionDemo() {
  const { t, fixed, selective, stepForward, reset } = useBothSteps();
  const fixedCurve: CurveLine = { points: fixed.map((h, i) => ({ x: i, y: h })), variant: "fit" };
  const selectiveCurve: CurveLine = { points: selective.map((h, i) => ({ x: i, y: h })), variant: "fitHighlight" };

  return (
    <>
      <MultiCurvePlayground
        curves={[fixedCurve, selectiveCurve]}
        domain={[0, SEQUENCE.length]}
        rangeDomain={[-4, 6]}
        readout={t === 0 ? "nothing processed yet" : `after token ${t} (x=${SEQUENCE[t - 1]}): fixed = ${fixed[t].toFixed(4)}, selective = ${selective[t].toFixed(4)}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.buttonActive} onClick={stepForward} disabled={t >= SEQUENCE.length}>
          Process next token
        </button>
        <button type="button" className={styles.button} onClick={reset}>
          Reset
        </button>
      </div>
    </>
  );
}

/** Play beat: the final state each rule ends up with, after the exact same 7-token sequence. */
export function PlayDemo() {
  const fixedFinal = FULL.fixed[FULL.fixed.length - 1];
  const selectiveFinal = FULL.selective[FULL.selective.length - 1];
  return (
    <ContributionBars
      items={[
        { label: "fixed A, B", value: fixedFinal },
        { label: "selective A, B", value: selectiveFinal },
      ]}
      formatValue={(v) => v.toFixed(4)}
      readout={`the sequence's last signal was exactly -3 — selective recovers it exactly; fixed only approximates it after decaying and blending`}
    />
  );
}

/** Checkpoint: find the timestep where the two rules' states diverge the most. */
export function SelectiveCheckpoint() {
  const [chosenT, setChosenT] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const diffs = FULL.fixed.map((f, i) => Math.abs(f - FULL.selective[i]));
  const maxDiff = Math.max(...diffs);
  const chosenDiff = chosenT === null ? null : diffs[chosenT];
  const passed = chosenDiff !== null && chosenDiff === maxDiff;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the timestep, among the seven, where the fixed and selective models&apos; states diverge the <strong>most</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a timestep to try it"
    >
      <div className={styles.buttons}>
        {SEQUENCE.map((_, i) => (
          <button
            key={i}
            type="button"
            className={i + 1 === chosenT ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosenT(i + 1);
            }}
          >
            t = {i + 1}
          </button>
        ))}
      </div>
      {chosenDiff !== null && <ContributionBars items={[{ label: "|fixed − selective|", value: chosenDiff }]} formatValue={(v) => v.toFixed(4)} max={maxDiff} />}
    </CheckpointFrame>
  );
}
