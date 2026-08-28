"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import {
  DEVICES,
  LEARNING_RATE,
  localGradient,
  federatedAverageGradient,
  federatedStep,
  pooledMean,
} from "@/lib/math-core/federated-learning";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../ipfs-and-content-addressed-storage/Controls.module.css";

const CONCEPT_ID = "federated-learning";
const BAR_MAX = 20;

function deviceItems(theta: number) {
  return DEVICES.map((d) => ({ label: d.name, value: localGradient(theta, d.data) }));
}

function withGlobal(theta: number) {
  return [...deviceItems(theta), { label: "Global (averaged)", value: federatedAverageGradient(theta, DEVICES) }];
}

function ThetaSlider({ value, onChange }: { value: number; onChange: (theta: number) => void }) {
  const id = useId();
  return (
    <div className={styles.row}>
      <label htmlFor={id}>θ = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={-2}
        max={12}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: move the shared parameter θ and watch each device's own local gradient — computed
 *  only from that device's own data, never shared with any other device — plus the averaged global one. */
export function IntuitionDemo() {
  const [theta, setTheta] = useState(0);
  return (
    <>
      <ContributionBars
        items={withGlobal(theta)}
        max={BAR_MAX}
        readout={`no device ever sees another device's raw data — only these gradient numbers travel`}
      />
      <div className={styles.controls}>
        <ThetaSlider value={theta} onChange={setTheta} />
      </div>
    </>
  );
}

/** Play beat: click through federated-averaging rounds and watch θ walk toward the pooled mean, purely
 *  from averaged local gradients — the same place a centralized fit on all the raw data would land. */
export function PlayDemo() {
  const [theta, setTheta] = useState(0);
  const [rounds, setRounds] = useState(0);
  const globalGrad = federatedAverageGradient(theta, DEVICES);

  return (
    <>
      <ContributionBars
        items={withGlobal(theta)}
        max={BAR_MAX}
        readout={`round ${rounds} — θ = ${theta.toFixed(3)}, global gradient = ${globalGrad.toFixed(3)} (target mean = ${pooledMean(DEVICES).toFixed(3)})`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setTheta((t) => federatedStep(t, DEVICES, LEARNING_RATE));
              setRounds((r) => r + 1);
            }}
          >
            Run one federated round
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setTheta(0);
              setRounds(0);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}

/** Checkpoint: run enough federated rounds that the global gradient is essentially zero — θ has converged. */
export function FederatedLearningCheckpoint() {
  const [theta, setTheta] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const globalGrad = federatedAverageGradient(theta, DEVICES);
  const passed = withinTolerance(globalGrad, 0, 0.05);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Click <strong>Run one federated round</strong> repeatedly until the global (averaged) gradient is
          within 0.05 of zero — θ has converged, using nothing but each device&apos;s own local gradient.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Run a round to try it"
    >
      <ContributionBars
        items={withGlobal(theta)}
        max={BAR_MAX}
        readout={`round ${rounds} — θ = ${theta.toFixed(3)}, global gradient = ${globalGrad.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setHasInteracted(true);
              setTheta((t) => federatedStep(t, DEVICES, LEARNING_RATE));
              setRounds((r) => r + 1);
            }}
          >
            Run one federated round
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setHasInteracted(true);
              setTheta(0);
              setRounds(0);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </CheckpointFrame>
  );
}
