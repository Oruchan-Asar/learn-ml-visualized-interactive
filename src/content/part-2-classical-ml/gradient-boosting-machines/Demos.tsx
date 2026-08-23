"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GBM_POINTS,
  GBM_F0,
  GBM_ROUNDS,
  MAX_GBM_ROUNDS,
  GBM_DOMAIN,
  GBM_Y_DOMAIN,
  gbmResiduals,
  totalSse,
  sampleGbmCurve,
} from "@/lib/math-core/gradient-boosting-machines";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "gradient-boosting-machines";
const CHECKPOINT_SSE_TARGET = 5;

function useGbmAtRound(rounds: number) {
  return useMemo(() => {
    const residuals = gbmResiduals(GBM_POINTS, GBM_F0, GBM_ROUNDS, rounds);
    const sse = totalSse(residuals);
    const curve: CurveLine = {
      points: sampleGbmCurve(GBM_F0, GBM_ROUNDS, rounds, GBM_DOMAIN),
      variant: "fitHighlight",
    };
    return { residuals, sse, curve };
  }, [rounds]);
}

function RoundSlider({ value, onChange }: { value: number; onChange: (rounds: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>rounds = {value}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={MAX_GBM_ROUNDS}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: 0 rounds is a flat line at the mean; each round bends it to chase the leftover residuals. */
export function IntuitionDemo() {
  const [rounds, setRounds] = useState(0);
  const { sse, curve } = useGbmAtRound(rounds);
  return (
    <>
      <MultiCurvePlayground
        curves={[curve]}
        scatterPoints={GBM_POINTS}
        domain={GBM_DOMAIN}
        rangeDomain={GBM_Y_DOMAIN}
        readout={`Rounds = ${rounds} — total SSE = ${sse}`}
      />
      <div className={styles.controls}>
        <RoundSlider value={rounds} onChange={setRounds} />
      </div>
    </>
  );
}

/** Play beat: same control, with every round's residuals listed so the "pseudo-residual" idea is visible, not just the curve. */
export function PlayDemo() {
  const [rounds, setRounds] = useState(0);
  const { residuals, sse, curve } = useGbmAtRound(rounds);
  return (
    <>
      <MultiCurvePlayground
        curves={[curve]}
        scatterPoints={GBM_POINTS}
        domain={GBM_DOMAIN}
        rangeDomain={GBM_Y_DOMAIN}
        readout={`Rounds = ${rounds} — total SSE = ${sse}`}
      />
      <div className={styles.controls}>
        <RoundSlider value={rounds} onChange={setRounds} />
      </div>
      <div className={styles.controls}>
        residuals: [{residuals.map((r) => r.toFixed(2)).join(", ")}]
      </div>
    </>
  );
}

/** Checkpoint: chain enough rounds to push total SSE below the target — one stump alone isn't enough. */
export function GbmCheckpoint() {
  const [rounds, setRounds] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const { sse, curve } = useGbmAtRound(rounds);

  const passed = sse < CHECKPOINT_SSE_TARGET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Chain enough rounds of stumps to push the total squared error below <strong>{CHECKPOINT_SSE_TARGET}</strong>.
          One round alone isn&rsquo;t enough — check the numbers.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the rounds slider to try it"
    >
      <MultiCurvePlayground
        curves={[curve]}
        scatterPoints={GBM_POINTS}
        domain={GBM_DOMAIN}
        rangeDomain={GBM_Y_DOMAIN}
        readout={`Rounds = ${rounds} — total SSE = ${sse}`}
      />
      <div className={styles.controls}>
        <RoundSlider
          value={rounds}
          onChange={(r) => {
            setHasInteracted(true);
            setRounds(r);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
