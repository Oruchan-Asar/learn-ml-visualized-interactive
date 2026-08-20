"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { bowl, bowlGradient, saddle, saddleGradient, LANDSCAPE_DOMAIN, TARGET_VALUE } from "@/lib/math-core/loss-landscape";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "loss-landscapes-in-high-dimensions";

/** Intuition beat: the gradient at the origin is exactly zero here too — but this isn't a minimum. */
export function IntuitionDemo() {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  return (
    <ContourPlayground
      fn={saddle}
      gradient={saddleGradient}
      domain={LANDSCAPE_DOMAIN}
      value={point}
      onChange={setPoint}
      readout={`f(${point.x.toFixed(1)}, ${point.y.toFixed(1)}) = ${saddle(point.x, point.y).toFixed(2)} — try moving along y only`}
    />
  );
}

/** Play beat: switch between the true bowl and the saddle, same starting point, same zero gradient. */
export function PlayDemo() {
  const [mode, setMode] = useState<"bowl" | "saddle">("bowl");
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const fn = mode === "bowl" ? bowl : saddle;
  const gradient = mode === "bowl" ? bowlGradient : saddleGradient;
  return (
    <>
      <ContourPlayground
        fn={fn}
        gradient={gradient}
        domain={LANDSCAPE_DOMAIN}
        value={point}
        onChange={setPoint}
        readout={`f(${point.x.toFixed(1)}, ${point.y.toFixed(1)}) = ${fn(point.x, point.y).toFixed(2)}`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={mode === "bowl" ? styles.buttonActive : styles.button} onClick={() => setMode("bowl")}>
            Bowl
          </button>
          <button type="button" className={mode === "saddle" ? styles.buttonActive : styles.button} onClick={() => setMode("saddle")}>
            Saddle
          </button>
        </div>
      </div>
    </>
  );
}

/** Checkpoint: starting exactly at the saddle's zero-gradient point, find a direction that actually decreases the loss. */
export function LandscapeCheckpoint() {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const value = saddle(point.x, point.y);

  const passed = value <= TARGET_VALUE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Starting exactly at the zero-gradient point, drag to reach a value of <strong>{TARGET_VALUE}</strong> or
          lower.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <ContourPlayground
        fn={saddle}
        gradient={saddleGradient}
        domain={LANDSCAPE_DOMAIN}
        value={point}
        onChange={(next) => {
          setHasInteracted(true);
          setPoint(next);
        }}
        passed={passed}
        readout={`f(${point.x.toFixed(1)}, ${point.y.toFixed(1)}) = ${value.toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
