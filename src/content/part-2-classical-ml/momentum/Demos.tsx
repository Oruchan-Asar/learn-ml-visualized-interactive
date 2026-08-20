"use client";

import { useEffect, useId, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { f, gradient, momentumStep, type Vec2, type MomentumState } from "@/lib/math-core/momentum";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const DOMAIN: [number, number] = [-4.5, 4.5];
const START: Vec2 = { x: 4, y: 1 };
const LEARNING_RATE = 0.045;
const CONCEPT_ID = "momentum";
const TOLERANCE = 0.3;
const STEP_BUDGET = 10;

function useMomentumDescent(beta: number) {
  const [state, setState] = useState<MomentumState>({ point: START, velocity: { x: 0, y: 0 } });
  const [history, setHistory] = useState<Vec2[]>([]);

  const step = () => {
    setHistory((h) => [...h, state.point]);
    setState((current) => momentumStep(current, gradient, LEARNING_RATE, beta));
  };
  const reset = () => {
    setState({ point: START, velocity: { x: 0, y: 0 } });
    setHistory([]);
  };
  const onChange = (next: Vec2) => {
    setState((current) => ({ ...current, point: next }));
  };

  return {
    point: state.point,
    velocity: state.velocity,
    onChange,
    history,
    step,
    reset,
    stepCount: history.length,
  };
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

function BetaSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (beta: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={styles.sliderRow} style={disabled ? { opacity: 0.4 } : undefined}>
      <label htmlFor={id}>β = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={0.95}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: momentum only, fixed β — watch velocity build and carry the point past where plain descent would crawl. */
export function IntuitionDemo() {
  const beta = 0.7;
  const { point, velocity, onChange, history, step, reset, stepCount } = useMomentumDescent(beta);
  return (
    <>
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={DOMAIN}
        value={point}
        onChange={onChange}
        trail={history}
        readout={`Step ${stepCount} — velocity magnitude = ${Math.hypot(velocity.x, velocity.y).toFixed(2)} (β = ${beta})`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: toggle Plain vs Momentum and tune β — watch the trail's shape change completely. */
export function PlayDemo() {
  const [mode, setMode] = useState<"plain" | "momentum">("plain");
  const [beta, setBeta] = useState(0.7);
  const effectiveBeta = mode === "plain" ? 0 : beta;
  const { point, velocity, onChange, history, step, reset, stepCount } = useMomentumDescent(effectiveBeta);

  return (
    <>
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={DOMAIN}
        value={point}
        onChange={onChange}
        trail={history}
        readout={`Step ${stepCount} — (x=${point.x.toFixed(2)}, y=${point.y.toFixed(2)}), |v| = ${Math.hypot(velocity.x, velocity.y).toFixed(2)}`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button
            type="button"
            className={mode === "plain" ? styles.buttonActive : styles.button}
            onClick={() => {
              setMode("plain");
              reset();
            }}
          >
            Plain
          </button>
          <button
            type="button"
            className={mode === "momentum" ? styles.buttonActive : styles.button}
            onClick={() => {
              setMode("momentum");
              reset();
            }}
          >
            Momentum
          </button>
        </div>
        <BetaSlider value={beta} onChange={setBeta} disabled={mode === "plain"} />
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: tune β to find the sweet spot — too little barely helps, too much overshoots and oscillates. */
export function MomentumCheckpoint() {
  const [beta, setBeta] = useState(0.3);
  const { point, onChange, history, step, reset, stepCount } = useMomentumDescent(beta);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const distance = Math.hypot(point.x, point.y);
  const passed = stepCount <= STEP_BUDGET && withinDistance(point, { x: 0, y: 0 }, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Tune <strong>β</strong> so momentum gets within <strong>0.3</strong> of the bottom of the ravine in{" "}
          <strong>{STEP_BUDGET} steps or fewer</strong>. Too low barely helps; too high overshoots and oscillates —
          find the sweet spot.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Take a step to try it"
    >
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={DOMAIN}
        value={point}
        onChange={onChange}
        trail={history}
        passed={passed}
        readout={`Step ${stepCount} / ${STEP_BUDGET} — distance to bottom = ${distance.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <BetaSlider value={beta} onChange={setBeta} />
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
