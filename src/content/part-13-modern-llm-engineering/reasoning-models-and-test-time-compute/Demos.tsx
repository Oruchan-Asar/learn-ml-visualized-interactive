"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { accuracy, accuracyDerivative, computeCost, utility, bestCotLength } from "@/lib/math-core/reasoning-models-and-test-time-compute";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const DOMAIN: [number, number] = [0, 20];
const CONCEPT_ID = "reasoning-models-and-test-time-compute";
const TARGET_L = bestCotLength();
const TOLERANCE = 0.5;

/** Intuition beat: drag the chain-of-thought length and watch accuracy climb, with a visibly shrinking slope. */
export function IntuitionDemo() {
  const [length, setLength] = useState(0);
  return (
    <CurvePlayground
      fn={accuracy}
      derivative={accuracyDerivative}
      domain={DOMAIN}
      value={length}
      onChange={setLength}
      readout={`chain-of-thought length = ${length.toFixed(1)} steps → accuracy = ${accuracy(length).toFixed(3)}`}
    />
  );
}

/** Play beat: same curve, now with the compute COST of that chain of thought read out alongside its accuracy. */
export function PlayDemo() {
  const [length, setLength] = useState(0);
  return (
    <CurvePlayground
      fn={accuracy}
      derivative={accuracyDerivative}
      domain={DOMAIN}
      value={length}
      onChange={setLength}
      readout={`accuracy = ${accuracy(length).toFixed(3)}, compute cost = ${computeCost(length).toFixed(2)}, net utility = ${utility(length).toFixed(3)}`}
    />
  );
}

/** Checkpoint: drag the chain-of-thought length until it lands on the utility-maximizing length. */
export function ReasoningTestTimeComputeCheckpoint() {
  const [length, setLength] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = withinTolerance(length, TARGET_L, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag the chain-of-thought length until you find the one that <strong>maximizes net utility</strong> — accuracy gained minus compute spent.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <CurvePlayground
        fn={utility}
        derivative={(l) => (utility(l + 0.01) - utility(l - 0.01)) / 0.02}
        domain={DOMAIN}
        value={length}
        onChange={(v) => {
          setHasInteracted(true);
          setLength(v);
        }}
        passed={passed}
        readout={`length = ${length.toFixed(1)}, net utility = ${utility(length).toFixed(4)}`}
      />
    </CheckpointFrame>
  );
}
