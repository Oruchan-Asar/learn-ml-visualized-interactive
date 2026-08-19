"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { crossEntropyLoss, crossEntropyLossDerivative, squaredErrorLoss } from "@/lib/math-core/cross-entropy";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const DOMAIN: [number, number] = [0.02, 0.98];
const TRUE_LABEL = 1;
const CONCEPT_ID = "cross-entropy-loss";
const TARGET_LOSS = 0.05;
const TOLERANCE = 0.03;
const START_P = 0.5;

/** Intuition beat: no formula yet — just drag the predicted probability and watch the loss react. */
export function IntuitionDemo() {
  const [p, setP] = useState(START_P);
  return (
    <CurvePlayground
      fn={(p) => crossEntropyLoss(TRUE_LABEL, p)}
      derivative={(p) => crossEntropyLossDerivative(TRUE_LABEL, p)}
      domain={DOMAIN}
      value={p}
      onChange={setP}
    />
  );
}

/** Play beat: same interaction, now with the loss read out alongside what squared error would give. */
export function PlayDemo() {
  const [p, setP] = useState(START_P);
  const loss = crossEntropyLoss(TRUE_LABEL, p);
  const sq = squaredErrorLoss(TRUE_LABEL, p);
  return (
    <CurvePlayground
      fn={(p) => crossEntropyLoss(TRUE_LABEL, p)}
      derivative={(p) => crossEntropyLossDerivative(TRUE_LABEL, p)}
      domain={DOMAIN}
      value={p}
      onChange={setP}
      readout={`L = ${loss.toFixed(2)}  (squared error would say ${sq.toFixed(2)})`}
    />
  );
}

/** Checkpoint: drag p until the loss for this true-positive example drops to (near) its target. */
export function CrossEntropyCheckpoint() {
  const [p, setP] = useState(START_P);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const loss = crossEntropyLoss(TRUE_LABEL, p);
  const passed = withinTolerance(loss, TARGET_LOSS, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          This example&rsquo;s true label is <strong>1</strong>. Drag <code>p</code> until the loss reads
          (approximately) <strong>0.05</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <CurvePlayground
        fn={(p) => crossEntropyLoss(TRUE_LABEL, p)}
        derivative={(p) => crossEntropyLossDerivative(TRUE_LABEL, p)}
        domain={DOMAIN}
        value={p}
        onChange={(next) => {
          setHasInteracted(true);
          setP(next);
        }}
        passed={passed}
        readout={`L = ${loss.toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
