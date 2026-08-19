"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { f, gradient } from "@/lib/math-core/gradient";
import { gradientDescentStep } from "@/lib/math-core/descent";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./DescentControls.module.css";

const DOMAIN: [number, number] = [-1.5, 8.5];
const START_X = 7.5;
const CONCEPT_ID = "gradient-descent";
const GRADIENT_TOLERANCE = 0.05;
const STEP_BUDGET = 15;

function useDescent(initialLearningRate: number) {
  const [x, setX] = useState(START_X);
  const [learningRate, setLearningRate] = useState(initialLearningRate);
  const [history, setHistory] = useState<number[]>([]);

  const step = () => {
    setHistory((h) => [...h, x]);
    setX((current) => gradientDescentStep(current, gradient, learningRate));
  };
  const reset = () => {
    setX(START_X);
    setHistory([]);
  };

  return { x, setX, learningRate, setLearningRate, history, step, reset, stepCount: history.length };
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

function LearningRateSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={styles.sliderRow}>
      η (learning rate)
      <input
        type="range"
        min={0.02}
        max={1.1}
        step={0.02}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {value.toFixed(2)}
    </label>
  );
}

/** Intuition beat: fixed learning rate, just step and watch the trail converge. */
export function IntuitionDemo() {
  const { x, setX, history, step, reset, stepCount } = useDescent(0.15);
  return (
    <>
      <CurvePlayground
        fn={f}
        derivative={gradient}
        domain={DOMAIN}
        value={x}
        onChange={setX}
        showTangent={false}
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
  const { x, setX, learningRate, setLearningRate, history, step, reset, stepCount } = useDescent(0.15);
  const g = gradient(x);
  return (
    <>
      <CurvePlayground
        fn={f}
        derivative={gradient}
        domain={DOMAIN}
        value={x}
        onChange={setX}
        trail={history}
        readout={`Step ${stepCount} — x = ${x.toFixed(2)}, ∇f(x) = ${g.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <LearningRateSlider value={learningRate} onChange={setLearningRate} />
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: reach a near-zero gradient within a fixed step budget — tune η to get there. */
export function DescentCheckpoint() {
  const { x, setX, learningRate, setLearningRate, history, step, reset, stepCount } = useDescent(0.1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const g = gradient(x);
  const passed = stepCount <= STEP_BUDGET && withinTolerance(g, 0, GRADIENT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Tune η and take steps until <code>∇f(x)</code> is within <strong>0.05</strong> of zero —{" "}
          <strong>{STEP_BUDGET} steps or fewer</strong>. Too small and you&rsquo;ll run out of steps; too
          large and you&rsquo;ll overshoot.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Set a learning rate and take a step to try it"
    >
      <CurvePlayground
        fn={f}
        derivative={gradient}
        domain={DOMAIN}
        value={x}
        onChange={setX}
        trail={history}
        passed={passed}
        readout={`Step ${stepCount} / ${STEP_BUDGET} — ∇f(x) = ${g.toFixed(2)}`}
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
