"use client";

import { useEffect, useState } from "react";
import { ScatterFitPlayground } from "@/components/viz/ScatterFitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  PERCEPTRON_POINTS,
  PERCEPTRON_X_DOMAIN,
  PERCEPTRON_Y_DOMAIN,
  LEARNING_RATE,
  perceptronStep,
  predict,
  lineEndpoints,
  type PerceptronState,
} from "@/lib/math-core/perceptron";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "the-perceptron";
const START: PerceptronState = { w: { x: 0, y: 0 }, b: 0 };
const noop = () => {};

function usePerceptron() {
  const [state, setState] = useState<PerceptronState>(START);
  const [stepIndex, setStepIndex] = useState(0);

  const currentPoint = PERCEPTRON_POINTS[stepIndex % PERCEPTRON_POINTS.length];
  const currentPrediction = predict(state.w, state.b, currentPoint);

  const step = () => {
    setState((s) => perceptronStep(s, currentPoint, LEARNING_RATE));
    setStepIndex((i) => i + 1);
  };
  const reset = () => {
    setState(START);
    setStepIndex(0);
  };

  const allCorrect = PERCEPTRON_POINTS.every((p) => predict(state.w, state.b, p) === (p.label === "B" ? 1 : -1));

  return { state, stepIndex, currentPoint, currentPrediction, step, reset, allCorrect };
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

/** Intuition beat: step through the points one at a time, watching the line move only when it's wrong. */
export function IntuitionDemo() {
  const { state, stepIndex, currentPoint, currentPrediction, step, reset } = usePerceptron();
  const { yLeft, yRight } = lineEndpoints(state.w, state.b, PERCEPTRON_X_DOMAIN, PERCEPTRON_Y_DOMAIN);
  const wasWrong = currentPrediction !== (currentPoint.label === "B" ? 1 : -1);

  return (
    <>
      <ScatterFitPlayground
        points={PERCEPTRON_POINTS}
        yLeft={yLeft}
        yRight={yRight}
        onChangeLeft={noop}
        onChangeRight={noop}
        xDomain={PERCEPTRON_X_DOMAIN}
        yDomain={PERCEPTRON_Y_DOMAIN}
        neutralLine
        readout={`Step ${stepIndex} — next up: (${currentPoint.x}, ${currentPoint.y}), class ${currentPoint.label}`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
        <span className={styles.stepCount}>{stepIndex > 0 ? (wasWrong ? "last point was wrong — line moved" : "last point was already correct") : ""}</span>
      </div>
    </>
  );
}

/** Play beat: same stepping, with the live weight vector and bias spelled out. */
export function PlayDemo() {
  const { state, currentPoint, step, reset } = usePerceptron();
  const { yLeft, yRight } = lineEndpoints(state.w, state.b, PERCEPTRON_X_DOMAIN, PERCEPTRON_Y_DOMAIN);

  return (
    <>
      <ScatterFitPlayground
        points={PERCEPTRON_POINTS}
        yLeft={yLeft}
        yRight={yRight}
        onChangeLeft={noop}
        onChangeRight={noop}
        xDomain={PERCEPTRON_X_DOMAIN}
        yDomain={PERCEPTRON_Y_DOMAIN}
        neutralLine
        readout={`w = (${state.w.x.toFixed(1)}, ${state.w.y.toFixed(1)}), b = ${state.b.toFixed(1)} — testing (${currentPoint.x}, ${currentPoint.y})`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: keep stepping until the line correctly classifies every single point. */
export function PerceptronCheckpoint() {
  const { state, stepIndex, currentPoint, step, reset, allCorrect } = usePerceptron();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const { yLeft, yRight } = lineEndpoints(state.w, state.b, PERCEPTRON_X_DOMAIN, PERCEPTRON_Y_DOMAIN);

  const passed = hasInteracted && allCorrect;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Keep taking steps until the line correctly separates every single point.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Take a step to try it"
    >
      <ScatterFitPlayground
        points={PERCEPTRON_POINTS}
        yLeft={yLeft}
        yRight={yRight}
        onChangeLeft={noop}
        onChangeRight={noop}
        xDomain={PERCEPTRON_X_DOMAIN}
        yDomain={PERCEPTRON_Y_DOMAIN}
        neutralLine
        passed={passed}
        readout={`Step ${stepIndex} — next up: (${currentPoint.x}, ${currentPoint.y}), class ${currentPoint.label}`}
      />
      <div className={styles.controls}>
        <StepResetButtons
          onStep={() => {
            setHasInteracted(true);
            step();
          }}
          onReset={reset}
        />
      </div>
    </CheckpointFrame>
  );
}
