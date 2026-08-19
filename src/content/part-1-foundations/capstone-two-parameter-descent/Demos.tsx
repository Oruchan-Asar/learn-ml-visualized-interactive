"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { f, gradient } from "@/lib/math-core/two-parameter-loss";
import { gradientDescentStep2D } from "@/lib/math-core/descent";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./DescentControls.module.css";

const DOMAIN: [number, number] = [-9, 9];
const START = { x: 7, y: -6 };
const TARGET = { x: 3, y: -2 };
const CONCEPT_ID = "capstone-two-parameter-descent";
const DISTANCE_TOLERANCE = 0.4;
const STEP_BUDGET = 12;

function useDescent(initialLearningRate: number) {
  const [point, setPoint] = useState(START);
  const [learningRate, setLearningRate] = useState(initialLearningRate);
  const [history, setHistory] = useState<{ x: number; y: number }[]>([]);

  const step = () => {
    setHistory((h) => [...h, point]);
    setPoint((current) => gradientDescentStep2D(current, gradient, learningRate));
  };
  const reset = () => {
    setPoint(START);
    setHistory([]);
  };

  return { point, setPoint, learningRate, setLearningRate, history, step, reset, stepCount: history.length };
}

function StepResetButtons({ onStep, onReset }: { onStep: () => void; onReset: () => void }) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={styles.buttonPrimary} onClick={onStep}>
        Take a step
      </button>
      <button type="button" className={styles.button} onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

function LearningRateSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className={styles.sliderRow}>
      η (learning rate)
      <input
        type="range"
        min={0.02}
        max={1.1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {value.toFixed(2)}
    </label>
  );
}

/** Intuition beat: fixed learning rate, just step and watch the trail find the minimum. */
export function IntuitionDemo() {
  const { point, setPoint, history, step, reset, stepCount } = useDescent(0.2);
  return (
    <>
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={DOMAIN}
        value={point}
        onChange={setPoint}
        trail={history}
        readout={`Step ${stepCount}`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: same interaction, now with the learning rate exposed as a slider. */
export function PlayDemo() {
  const { point, setPoint, learningRate, setLearningRate, history, step, reset, stepCount } = useDescent(0.2);
  const g = gradient(point.x, point.y);
  return (
    <>
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={DOMAIN}
        value={point}
        onChange={setPoint}
        trail={history}
        readout={`Step ${stepCount} — (${point.x.toFixed(1)}, ${point.y.toFixed(1)}), |∇f| = ${Math.hypot(g.x, g.y).toFixed(1)}`}
      />
      <div className={styles.controls}>
        <LearningRateSlider value={learningRate} onChange={setLearningRate} />
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: reach the minimum's neighborhood within a fixed step budget — tune η to get there. */
export function CapstoneCheckpoint() {
  const { point, setPoint, learningRate, setLearningRate, history, step, reset, stepCount } = useDescent(0.15);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const distance = Math.hypot(point.x - TARGET.x, point.y - TARGET.y);
  const passed = stepCount <= STEP_BUDGET && withinDistance(point, TARGET, DISTANCE_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Tune η and take steps until you&rsquo;re within <strong>0.4</strong> of the minimum at{" "}
          <strong>(3, -2)</strong> — <strong>{STEP_BUDGET} steps or fewer</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Set a learning rate and take a step to try it"
    >
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={DOMAIN}
        value={point}
        onChange={setPoint}
        trail={history}
        passed={passed}
        readout={`Step ${stepCount} / ${STEP_BUDGET} — distance to target = ${distance.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <LearningRateSlider value={learningRate} onChange={setLearningRate} />
        <StepResetButtons
          onStep={() => {
            setHasInteracted(true);
            step();
          }}
          onReset={reset}
        />
        <span className={styles.stepCount}>
          {stepCount}/{STEP_BUDGET} steps used
        </span>
      </div>
    </CheckpointFrame>
  );
}
