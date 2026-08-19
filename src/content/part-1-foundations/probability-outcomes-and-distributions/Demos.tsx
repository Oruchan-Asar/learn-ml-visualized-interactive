"use client";

import { useEffect, useState } from "react";
import { DistributionPlayground } from "@/components/viz/DistributionPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { normalize, expectedValue } from "@/lib/math-core/probability";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const LABELS = ["A", "B", "C", "D"];
const VALUES = [1, 2, 3, 4];
const CONCEPT_ID = "probability-outcomes-and-distributions";
const TARGET_EXPECTED = 2;
const TOLERANCE = 0.15;

function useDistribution(initialWeights: number[]) {
  const [weights, setWeights] = useState(initialWeights);
  const probabilities = normalize(weights);
  const onDrag = (index: number, fraction: number) => {
    setWeights((prev) => prev.map((w, i) => (i === index ? fraction : w)));
  };
  return { probabilities, onDrag };
}

/** Intuition beat: just watch the bars renormalize as you drag one of them. */
export function IntuitionDemo() {
  const { probabilities, onDrag } = useDistribution([0.5, 0.5, 0.5, 0.5]);
  return <DistributionPlayground labels={LABELS} probabilities={probabilities} onDrag={onDrag} />;
}

/** Play beat: same interaction, now with the expected value read out live. */
export function PlayDemo() {
  const { probabilities, onDrag } = useDistribution([0.5, 0.5, 0.5, 0.5]);
  const ev = expectedValue(probabilities, VALUES);
  return (
    <DistributionPlayground
      labels={LABELS}
      probabilities={probabilities}
      onDrag={onDrag}
      readout={`E[X] = ${ev.toFixed(2)}`}
    />
  );
}

/** Checkpoint: reshape the distribution until the expected value hits a target. */
export function DistributionCheckpoint() {
  const { probabilities, onDrag } = useDistribution([0.5, 0.5, 0.5, 0.5]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const ev = expectedValue(probabilities, VALUES);
  const passed = withinTolerance(ev, TARGET_EXPECTED, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Reshape the distribution until <code>E[X]</code> reads (approximately) <strong>2.0</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag a bar to try it"
    >
      <DistributionPlayground
        labels={LABELS}
        probabilities={probabilities}
        onDrag={(i, f) => {
          setHasInteracted(true);
          onDrag(i, f);
        }}
        passed={passed}
        readout={`E[X] = ${ev.toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
