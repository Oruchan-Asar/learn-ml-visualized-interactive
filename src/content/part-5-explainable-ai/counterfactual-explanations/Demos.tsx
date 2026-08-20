"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  DOMAIN,
  START_POINT,
  decisionValue,
  gradient,
  isApproved,
  distanceToBoundary,
  nearestCounterfactual,
} from "@/lib/math-core/counterfactual-explanations";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "counterfactual-explanations";

/** Intuition beat: drag the applicant's point, watch the constant gradient arrow point straight at "approved." */
export function IntuitionDemo() {
  const [point, setPoint] = useState(START_POINT);
  const approved = isApproved(point.x, point.y);
  return (
    <ContourPlayground
      fn={(x, y) => decisionValue(x, y)}
      gradient={gradient}
      domain={DOMAIN}
      value={point}
      onChange={setPoint}
      readout={`decision value ${decisionValue(point.x, point.y).toFixed(1)} — ${approved ? "approved" : "denied"}, distance to boundary ${distanceToBoundary(point.x, point.y).toFixed(2)}`}
    />
  );
}

/** Play beat: watch the nearest counterfactual point (the marked dot) track the smallest fix as you drag. */
export function PlayDemo() {
  const [point, setPoint] = useState(START_POINT);
  const cf = nearestCounterfactual(point.x, point.y);
  return (
    <ContourPlayground
      fn={(x, y) => decisionValue(x, y)}
      gradient={gradient}
      domain={DOMAIN}
      value={point}
      onChange={setPoint}
      labeledPoints={[{ x: cf.x, y: cf.y, label: "counterfactual" }]}
      readout={`nearest point that flips the decision: (${cf.x.toFixed(2)}, ${cf.y.toFixed(2)}) — ${distanceToBoundary(point.x, point.y).toFixed(2)} units away`}
    />
  );
}

/** Checkpoint: drag the point until the decision actually flips from denied to approved. */
export function CounterfactualCheckpoint() {
  const [point, setPoint] = useState(START_POINT);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const approved = isApproved(point.x, point.y);
  const passed = approved;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag the point until the decision flips from <strong>denied</strong> to <strong>approved</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <ContourPlayground
        fn={(x, y) => decisionValue(x, y)}
        gradient={gradient}
        domain={DOMAIN}
        value={point}
        onChange={(next) => {
          setHasInteracted(true);
          setPoint(next);
        }}
        passed={passed}
        readout={`decision value ${decisionValue(point.x, point.y).toFixed(1)} — ${approved ? "approved" : "denied"}`}
      />
    </CheckpointFrame>
  );
}
