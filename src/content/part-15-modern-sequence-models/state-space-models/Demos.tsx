"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { SEQUENCE, step, output, ssmMemory, attentionMemory } from "@/lib/math-core/state-space-models";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "state-space-models";
const MAX_N = 64;

function useSSMSteps() {
  const [states, setStates] = useState<number[]>([0]);

  const stepForward = () => {
    setStates((prev) => {
      const t = prev.length - 1;
      if (t >= SEQUENCE.length) return prev;
      return [...prev, step(prev[prev.length - 1], SEQUENCE[t])];
    });
  };
  const reset = () => setStates([0]);

  const t = states.length - 1;
  return { t, states, stepForward, reset };
}

/** Intuition beat: step through the sequence one token at a time and watch the single hidden state update. */
export function IntuitionDemo() {
  const { t, states, stepForward, reset } = useSSMSteps();
  const curve: CurveLine = { points: states.map((h, i) => ({ x: i, y: h })), variant: "fitHighlight" };

  return (
    <>
      <MultiCurvePlayground
        curves={[curve]}
        domain={[0, SEQUENCE.length]}
        rangeDomain={[-1, 2]}
        scatterPoints={states.map((h, i) => ({ x: i, y: h }))}
        readout={t === 0 ? "h₀ = 0 — nothing processed yet" : `after token ${t} (x=${SEQUENCE[t - 1]}): h${t} = ${states[t].toFixed(4)}, y${t} = ${output(states[t]).toFixed(4)}`}
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

/** Play beat: memory footprint as the sequence grows — one fixed-size state versus a cache that has to grow with n. */
export function PlayDemo() {
  const ssmCurve: CurveLine = { points: Array.from({ length: 65 }, (_, i) => ({ x: (MAX_N * i) / 64, y: ssmMemory() })), variant: "fitHighlight" };
  const attnCurve: CurveLine = { points: Array.from({ length: 65 }, (_, i) => ({ x: (MAX_N * i) / 64, y: attentionMemory((MAX_N * i) / 64) })), variant: "true" };
  return (
    <MultiCurvePlayground
      curves={[attnCurve, ssmCurve]}
      domain={[0, MAX_N]}
      rangeDomain={[0, MAX_N]}
      readout={`at n = ${MAX_N}: attention keeps ${attentionMemory(MAX_N)} cached key-value pairs; the SSM keeps ${ssmMemory()} state`}
    />
  );
}

/** Checkpoint: find the timestep whose hidden state has the smallest magnitude. */
export function SSMCheckpoint() {
  const [chosenT, setChosenT] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const states: number[] = [0];
  for (const x of SEQUENCE) states.push(step(states[states.length - 1], x));
  const magnitudes = states.slice(1).map(Math.abs);
  const minMagnitude = Math.min(...magnitudes);
  const chosenMagnitude = chosenT === null ? null : magnitudes[chosenT - 1];
  const passed = chosenMagnitude !== null && chosenMagnitude === minMagnitude;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the timestep, among the five, whose hidden state has the <strong>smallest magnitude</strong>.</>}
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
      {chosenMagnitude !== null && <ContributionBars items={[{ label: `|h${chosenT}|`, value: chosenMagnitude }]} formatValue={(v) => v.toFixed(4)} max={Math.max(...magnitudes)} />}
    </CheckpointFrame>
  );
}
