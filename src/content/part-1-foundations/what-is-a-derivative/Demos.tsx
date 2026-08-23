"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { f, gradient } from "@/lib/math-core/gradient";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const DOMAIN: [number, number] = [-1, 6];
const CONCEPT_ID = "what-is-a-derivative";
const TARGET_DERIVATIVE = 0;
const TOLERANCE = 0.2;

/** Intuition beat: just the curve and the tangent line, no numbers yet. */
export function IntuitionDemo() {
  const [x, setX] = useState(5);
  return <CurvePlayground fn={f} derivative={gradient} domain={DOMAIN} value={x} onChange={setX} />;
}

/** Play beat: same interaction, now with the formula's value read out live. */
export function PlayDemo() {
  const [x, setX] = useState(5);
  const d = gradient(x);
  return (
    <CurvePlayground
      fn={f}
      derivative={gradient}
      domain={DOMAIN}
      value={x}
      onChange={setX}
      readout={`f'(${x.toFixed(2)}) = 2(${x.toFixed(2)}) − 4 = ${d.toFixed(2)}`}
    />
  );
}

/** Checkpoint: drag until the derivative reads ~0 — i.e. find the minimum. */
export function DerivativeCheckpoint() {
  const [x, setX] = useState(5);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const d = gradient(x);
  const passed = withinTolerance(d, TARGET_DERIVATIVE, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the point until the derivative reads (approximately) <strong>zero</strong> — that&rsquo;s the
          flat spot where the curve stops rising or falling.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <CurvePlayground
        fn={f}
        derivative={gradient}
        domain={DOMAIN}
        value={x}
        onChange={(next) => {
          setHasInteracted(true);
          setX(next);
        }}
        passed={passed}
        readout={`f'(${x.toFixed(2)}) = ${d.toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
