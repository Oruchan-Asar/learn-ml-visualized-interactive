"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { sumSquaredError } from "@/lib/math-core/linear-regression";
import { VARIANTS_DATA_POINTS, sseGradient, type Params } from "@/lib/math-core/gradient-descent-variants";
import { gradientDescentStep2D } from "@/lib/math-core/descent";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./DescentControls.module.css";

const DOMAIN: [number, number] = [-1, 3.5];
const START: Params = { w: 0, b: 0 };
const OPTIMUM: Params = { w: 1.97, b: 1.02 };
const CONCEPT_ID = "gradient-descent-variants";
const TOLERANCE = 0.4;
const STEP_BUDGET = 20;

type Mode = "batch" | "stochastic" | "minibatch";

// ContourPlayground is generic over {x,y}; this chapter's parameters are
// named (w,b), so every call site adapts at the boundary rather than
// renaming the primitive's own interface.
const toXY = (p: Params) => ({ x: p.w, y: p.b });
const fromXY = (p: { x: number; y: number }): Params => ({ w: p.x, b: p.y });

function subsetForStep(mode: Mode, stepIndex: number) {
  const n = VARIANTS_DATA_POINTS.length;
  if (mode === "batch") return VARIANTS_DATA_POINTS;
  if (mode === "stochastic") return [VARIANTS_DATA_POINTS[stepIndex % n]];
  return [VARIANTS_DATA_POINTS[stepIndex % n], VARIANTS_DATA_POINTS[(stepIndex + 1) % n]];
}

const lossField = (w: number, b: number) => sumSquaredError(VARIANTS_DATA_POINTS, w, b);

function useVariantDescent(mode: Mode, learningRate: number) {
  const [point, setPoint] = useState<Params>(START);
  const [history, setHistory] = useState<Params[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  const gradientAtCurrentStep = (w: number, b: number) => sseGradient(subsetForStep(mode, stepIndex), w, b);
  const gradientXY = (x: number, y: number) => toXY(gradientAtCurrentStep(x, y));

  const step = () => {
    setHistory((h) => [...h, point]);
    // gradientDescentStep2D is generic over {x,y}; this chapter's state is
    // {w,b}, so we bridge through toXY/fromXY the same way the view layer does.
    setPoint((current) => fromXY(gradientDescentStep2D(toXY(current), gradientXY, learningRate)));
    setStepIndex((i) => i + 1);
  };
  const reset = () => {
    setPoint(START);
    setHistory([]);
    setStepIndex(0);
  };

  return {
    point,
    onChangeXY: (next: { x: number; y: number }) => setPoint(fromXY(next)),
    gradientAtCurrentStep,
    gradientXY,
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

const MODES: { key: Mode; label: string }[] = [
  { key: "batch", label: "Batch" },
  { key: "stochastic", label: "Stochastic" },
  { key: "minibatch", label: "Mini-batch" },
];

function ModePicker({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className={styles.buttons}>
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          className={m.key === value ? styles.buttonActive : styles.button}
          onClick={() => onChange(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

/** Intuition beat: batch mode only, fixed — establish the smooth baseline path. */
export function IntuitionDemo() {
  const { point, onChangeXY, gradientXY, history, step, reset, stepCount } = useVariantDescent("batch", 0.2);
  return (
    <>
      <ContourPlayground
        fn={lossField}
        gradient={gradientXY}
        domain={DOMAIN}
        value={toXY(point)}
        onChange={onChangeXY}
        trail={history.map(toXY)}
        readout={`Step ${stepCount} — using all ${VARIANTS_DATA_POINTS.length} points every time`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: switch modes and watch the trail's shape change completely. */
export function PlayDemo() {
  const [mode, setMode] = useState<Mode>("batch");
  const { point, onChangeXY, gradientAtCurrentStep, gradientXY, history, step, reset, stepCount } =
    useVariantDescent(mode, 0.2);
  const g = gradientAtCurrentStep(point.w, point.b);
  return (
    <>
      <ContourPlayground
        fn={lossField}
        gradient={gradientXY}
        domain={DOMAIN}
        value={toXY(point)}
        onChange={onChangeXY}
        trail={history.map(toXY)}
        readout={`Step ${stepCount} — (w=${point.w.toFixed(2)}, b=${point.b.toFixed(2)}), |∇| = ${Math.hypot(g.w, g.b).toFixed(2)}`}
      />
      <div className={styles.controls}>
        <ModePicker value={mode} onChange={setMode} />
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: stochastic mode specifically — reach the true optimum despite noisy per-step gradients. */
export function VariantsCheckpoint() {
  const { point, onChangeXY, gradientXY, history, step, reset, stepCount } = useVariantDescent("stochastic", 0.2);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const distance = Math.hypot(point.w - OPTIMUM.w, point.b - OPTIMUM.b);
  const passed = stepCount <= STEP_BUDGET && withinDistance(toXY(point), toXY(OPTIMUM), TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Using <strong>stochastic</strong> steps — one data point at a time — get within{" "}
          <strong>0.4</strong> of the true optimum in <strong>{STEP_BUDGET} steps or fewer</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Take a step to try it"
    >
      <ContourPlayground
        fn={lossField}
        gradient={gradientXY}
        domain={DOMAIN}
        value={toXY(point)}
        onChange={onChangeXY}
        trail={history.map(toXY)}
        passed={passed}
        readout={`Step ${stepCount} / ${STEP_BUDGET} — distance to optimum = ${distance.toFixed(2)}`}
      />
      <div className={styles.controls}>
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
