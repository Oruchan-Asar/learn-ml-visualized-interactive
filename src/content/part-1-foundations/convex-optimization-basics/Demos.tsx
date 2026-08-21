"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { gradientDescentStep } from "@/lib/math-core/descent";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import {
  convexBowl,
  convexBowlGradient,
  doubleWell,
  doubleWellGradient,
  DOMAIN,
} from "@/lib/math-core/convex-optimization-basics";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./ConvexControls.module.css";

const CONCEPT_ID = "convex-optimization-basics";
const GRADIENT_TOLERANCE = 0.05;

function useDescent(initialX: number, gradient: (x: number) => number, learningRate: number) {
  const [x, setX] = useState(initialX);
  const [history, setHistory] = useState<number[]>([]);
  const step = () => {
    setHistory((h) => [...h, x]);
    setX((current) => gradientDescentStep(current, gradient, learningRate));
  };
  const reset = (resetX: number) => {
    setX(resetX);
    setHistory([]);
  };
  return { x, setX, history, step, reset, stepCount: history.length };
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

/** Intuition beat: just drag the point along the double well and feel the two dips separated by a bump. */
export function IntuitionDemo() {
  const [x, setX] = useState(-0.3);
  return (
    <CurvePlayground
      fn={doubleWell}
      derivative={doubleWellGradient}
      domain={DOMAIN}
      value={x}
      onChange={setX}
      readout={`f(x) = ${doubleWell(x).toFixed(2)}`}
    />
  );
}

/**
 * Play beat: toggle between the convex bowl and the double well, drag a starting point, and step
 * gradient descent — on the bowl every start converges to the same place; on the well it doesn't.
 */
export function PlayDemo() {
  const [mode, setMode] = useState<"bowl" | "well">("well");
  const fn = mode === "bowl" ? convexBowl : doubleWell;
  const gradient = mode === "bowl" ? convexBowlGradient : doubleWellGradient;
  const { x, setX, history, step, reset, stepCount } = useDescent(-0.3, gradient, 0.05);

  return (
    <>
      <CurvePlayground
        fn={fn}
        derivative={gradient}
        domain={DOMAIN}
        value={x}
        onChange={setX}
        trail={history}
        readout={`Step ${stepCount} — x = ${x.toFixed(3)}, f'(x) = ${gradient(x).toFixed(3)}`}
      />
      <div className={styles.controls}>
        <div className={styles.presetRow}>
          <button
            type="button"
            className={mode === "bowl" ? styles.presetButtonActive : styles.presetButton}
            onClick={() => {
              setMode("bowl");
              reset(-1.8);
            }}
          >
            Convex bowl
          </button>
          <button
            type="button"
            className={mode === "well" ? styles.presetButtonActive : styles.presetButton}
            onClick={() => {
              setMode("well");
              reset(-0.3);
            }}
          >
            Non-convex double well
          </button>
        </div>
        <StepResetButtons onStep={step} onReset={() => reset(mode === "bowl" ? -1.8 : -0.3)} />
      </div>
    </>
  );
}

/** Checkpoint: drag the starting point anywhere on the double well and step until the gradient vanishes. */
export function ConvexCheckpoint() {
  const { x, setX, history, step, reset, stepCount } = useDescent(-0.3, doubleWellGradient, 0.05);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const g = doubleWellGradient(x);
  const passed = withinTolerance(g, 0, GRADIENT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the starting point anywhere, then take steps until <code>f&apos;(x)</code> lands within{" "}
          <strong>0.05</strong> of zero. Notice: which minimum you land on depends entirely on which side
          of the bump at x = 0 you started from.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point, then take steps"
    >
      <CurvePlayground
        fn={doubleWell}
        derivative={doubleWellGradient}
        domain={DOMAIN}
        value={x}
        onChange={(next) => {
          setHasInteracted(true);
          setX(next);
        }}
        trail={history}
        passed={passed}
        readout={`Step ${stepCount} — f'(x) = ${g.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <StepResetButtons
          onStep={() => {
            setHasInteracted(true);
            step();
          }}
          onReset={() => reset(-0.3)}
        />
      </div>
    </CheckpointFrame>
  );
}
