"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { LEARNING_RATES, STEPS, descentTrace, loss, gridSearch, bestResult } from "@/lib/math-core/hyperparameter-tuning";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "hyperparameter-tuning";

function traceCurve(learningRate: number): CurveLine {
  return {
    points: descentTrace(learningRate).map((x, i) => ({ x: i, y: loss(x) })),
    variant: "fitHighlight",
  };
}

/** Intuition beat: pick a learning rate and watch the same fixed 20-step budget behave completely differently. */
export function IntuitionDemo() {
  const [lr, setLr] = useState(0.1);
  const trace = descentTrace(lr);
  const finalLoss = loss(trace[trace.length - 1]);
  const yMax = Math.max(1, ...trace.map((x) => loss(x)));
  return (
    <>
      <div className={styles.buttons}>
        {LEARNING_RATES.map((rate) => (
          <button key={rate} type="button" className={rate === lr ? styles.buttonActive : styles.button} onClick={() => setLr(rate)}>
            lr={rate}
          </button>
        ))}
      </div>
      <MultiCurvePlayground
        curves={[traceCurve(lr)]}
        domain={[0, STEPS]}
        rangeDomain={[0, yMax]}
        readout={`after ${STEPS} steps: loss = ${finalLoss.toFixed(4)}`}
      />
    </>
  );
}

/** Play beat: the whole grid at once — most candidates converge, one goes to exactly zero, one blows up. */
export function PlayDemo() {
  const results = gridSearch();
  const best = bestResult(results);
  return (
    <ContributionBars
      items={results.map((r) => ({ label: `lr=${r.learningRate}`, value: r.finalLoss }))}
      formatValue={(v) => v.toFixed(3)}
      readout={`grid search picks lr=${best.learningRate} — the only candidate that reaches loss=0`}
    />
  );
}

/** Checkpoint: find the one learning rate, among the six candidates, that drives the loss to exactly zero. */
export function HyperparameterTuningCheckpoint() {
  const [lr, setLr] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const finalLoss = lr === null ? null : loss(descentTrace(lr)[STEPS]);
  const passed = finalLoss === 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the <strong>one learning rate</strong>, among the six candidates, that drives the loss all the way to <strong>zero</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a learning rate to try it"
    >
      <div className={styles.buttons}>
        {LEARNING_RATES.map((rate) => (
          <button
            key={rate}
            type="button"
            className={rate === lr ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setLr(rate);
            }}
          >
            lr={rate}
          </button>
        ))}
      </div>
      {finalLoss !== null && <ContributionBars items={[{ label: `lr=${lr}`, value: finalLoss }]} formatValue={(v) => v.toFixed(3)} readout={`final loss = ${finalLoss.toFixed(4)}`} />}
    </CheckpointFrame>
  );
}
