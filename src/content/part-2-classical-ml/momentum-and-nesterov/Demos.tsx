"use client";

import { useEffect, useId, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  f,
  gradient,
  momentumStep,
  nesterovStep,
  type Vec2,
  type MomentumState,
} from "@/lib/math-core/momentum-and-nesterov";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const DOMAIN: [number, number] = [-4.5, 4.5];
const START: Vec2 = { x: 4, y: 1 };
const LEARNING_RATE = 0.045;
const CONCEPT_ID = "momentum-and-nesterov";
const TOLERANCE = 0.3;
const STEP_BUDGET = 10;

type Mode = "plain" | "momentum" | "nesterov";

function useDescent(mode: Mode, beta: number) {
  const [state, setState] = useState<MomentumState>({ point: START, velocity: { x: 0, y: 0 } });
  const [history, setHistory] = useState<Vec2[]>([]);

  const step = () => {
    setHistory((h) => [...h, state.point]);
    setState((current) => {
      const effectiveBeta = mode === "plain" ? 0 : beta;
      return mode === "nesterov"
        ? nesterovStep(current, gradient, LEARNING_RATE, effectiveBeta)
        : momentumStep(current, gradient, LEARNING_RATE, effectiveBeta);
    });
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

function BetaSlider({ value, onChange, disabled }: { value: number; onChange: (beta: number) => void; disabled?: boolean }) {
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

/** Intuition beat: Momentum vs Nesterov at a fixed β — watch the two trails split apart after step one. */
export function IntuitionDemo() {
  const beta = 0.7;
  const momentum = useDescent("momentum", beta);
  const nesterov = useDescent("nesterov", beta);

  const stepBoth = () => {
    momentum.step();
    nesterov.step();
  };
  const resetBoth = () => {
    momentum.reset();
    nesterov.reset();
  };

  return (
    <>
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={DOMAIN}
        value={momentum.point}
        onChange={momentum.onChange}
        trail={momentum.history}
        extraSeries={[{ point: nesterov.point, trail: nesterov.history, colorClass: "accent2" }]}
        readout={`Step ${momentum.stepCount} — accent = Momentum, ink = Nesterov (both β = ${beta})`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={stepBoth} onReset={resetBoth} />
      </div>
    </>
  );
}

/** Play beat: toggle Plain / Momentum / Nesterov and tune β — watch the trail shapes diverge. */
export function PlayDemo() {
  const [mode, setMode] = useState<Mode>("plain");
  const [beta, setBeta] = useState(0.7);
  const { point, velocity, onChange, history, step, reset, stepCount } = useDescent(mode, beta);

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
          {(["plain", "momentum", "nesterov"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? styles.buttonActive : styles.button}
              onClick={() => {
                setMode(m);
                reset();
              }}
            >
              {m === "plain" ? "Plain" : m === "momentum" ? "Momentum" : "Nesterov"}
            </button>
          ))}
        </div>
        <BetaSlider value={beta} onChange={setBeta} disabled={mode === "plain"} />
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: tune β so Nesterov gets within tolerance of the bottom within the step budget. */
export function NesterovCheckpoint() {
  const [beta, setBeta] = useState(0.3);
  const { point, onChange, history, step, reset, stepCount } = useDescent("nesterov", beta);
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
          Using <strong>Nesterov</strong>, tune <strong>β</strong> so the point gets within{" "}
          <strong>0.3</strong> of the bottom of the ravine in <strong>{STEP_BUDGET} steps or fewer</strong>.
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
