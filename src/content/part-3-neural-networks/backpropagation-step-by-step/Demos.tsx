"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  lossAt,
  gradientAt,
  forward,
  W11_DOMAIN,
  DEFAULT_W11,
  TARGET_GRADIENT,
} from "@/lib/math-core/backpropagation";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "backpropagation-step-by-step";
const TOLERANCE = 0.005;

/** Intuition beat: drag w11, watch the loss curve and its backprop-computed tangent. */
export function IntuitionDemo() {
  const [w11, setW11] = useState(DEFAULT_W11);
  const { h1, y } = forward(w11);
  return (
    <CurvePlayground
      fn={lossAt}
      derivative={gradientAt}
      domain={W11_DOMAIN}
      value={w11}
      onChange={setW11}
      readout={`w11 = ${w11.toFixed(2)} — h1 = ${h1.toFixed(2)}, y = ${y.toFixed(2)}, dL/dw11 = ${gradientAt(w11).toFixed(4)}`}
    />
  );
}

/** Play beat: same curve — the tangent is the product of four terms, all the way back through both layers. */
export function PlayDemo() {
  const [w11, setW11] = useState(-1);
  return (
    <CurvePlayground
      fn={lossAt}
      derivative={gradientAt}
      domain={W11_DOMAIN}
      value={w11}
      onChange={setW11}
      readout={`loss = ${lossAt(w11).toFixed(4)}, dL/dw11 = ${gradientAt(w11).toFixed(4)}`}
    />
  );
}

/** Checkpoint: find the w11 where the backprop-computed gradient reaches the target. */
export function BackpropCheckpoint() {
  const [w11, setW11] = useState(DEFAULT_W11);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const gradient = gradientAt(w11);

  const passed = withinTolerance(gradient, TARGET_GRADIENT, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag w11 until <strong>dL/dw11</strong> reaches <strong>{TARGET_GRADIENT}</strong> (within{" "}
          <strong>{TOLERANCE}</strong>).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <CurvePlayground
        fn={lossAt}
        derivative={gradientAt}
        domain={W11_DOMAIN}
        value={w11}
        onChange={(next) => {
          setHasInteracted(true);
          setW11(next);
        }}
        passed={passed}
        readout={`w11 = ${w11.toFixed(2)} — dL/dw11 = ${gradient.toFixed(4)}`}
      />
    </CheckpointFrame>
  );
}
