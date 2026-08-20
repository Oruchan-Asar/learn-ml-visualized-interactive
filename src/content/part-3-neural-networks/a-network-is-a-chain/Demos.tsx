"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { sigmoidDerivative } from "@/lib/math-core/activation-functions";
import {
  hiddenValue,
  composedOutput,
  chainDerivative,
  CHAIN_DOMAIN,
  TARGET_X,
  TARGET_SLOPE,
  W1,
  B1,
  W2,
  B2,
} from "@/lib/math-core/network-chain";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "a-network-is-a-chain";
const TOLERANCE = 0.02;

/** Intuition beat: drag along the composed curve — the tangent shown is the *product* of two layers' local slopes. */
export function IntuitionDemo() {
  const [x, setX] = useState(0);
  const h = hiddenValue(x);
  return (
    <CurvePlayground
      fn={composedOutput}
      derivative={chainDerivative}
      domain={CHAIN_DOMAIN}
      value={x}
      onChange={setX}
      readout={`h(x) = ${h.toFixed(2)}, y(x) = ${composedOutput(x).toFixed(2)}, dy/dx = ${chainDerivative(x).toFixed(3)}`}
    />
  );
}

/** Play beat: the same curve, with the two multiplied factors spelled out separately. */
export function PlayDemo() {
  const [x, setX] = useState(1);
  const h = hiddenValue(x);
  const dh_dx = sigmoidDerivative(W1 * x + B1) * W1;
  const dy_dh = sigmoidDerivative(W2 * h + B2) * W2;
  return (
    <CurvePlayground
      fn={composedOutput}
      derivative={chainDerivative}
      domain={CHAIN_DOMAIN}
      value={x}
      onChange={setX}
      readout={`dy/dh = ${dy_dh.toFixed(3)}  ×  dh/dx = ${dh_dx.toFixed(3)}  =  ${(dy_dh * dh_dx).toFixed(3)}`}
    />
  );
}

/** Checkpoint: find the x where the composed slope matches the target — reached by dragging through the chain, not tuning each layer separately. */
export function ChainCheckpoint() {
  const [x, setX] = useState(-3);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const slope = chainDerivative(x);

  const passed = withinTolerance(slope, TARGET_SLOPE, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag along the curve until its slope reaches <strong>{TARGET_SLOPE.toFixed(3)}</strong> — the slope at{" "}
          x = {TARGET_X}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <CurvePlayground
        fn={composedOutput}
        derivative={chainDerivative}
        domain={CHAIN_DOMAIN}
        value={x}
        onChange={(next) => {
          setHasInteracted(true);
          setX(next);
        }}
        passed={passed}
        readout={`x = ${x.toFixed(2)} — dy/dx = ${slope.toFixed(3)}`}
      />
    </CheckpointFrame>
  );
}
