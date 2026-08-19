"use client";

import { useEffect, useState } from "react";
import { DistributionPlayground } from "@/components/viz/DistributionPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { normalize } from "@/lib/math-core/probability";
import { entropy } from "@/lib/math-core/entropy";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const LABELS = ["A", "B", "C", "D"];
const CONCEPT_ID = "information-and-entropy";
const TARGET_ENTROPY = 1.5;
const TOLERANCE = 0.1;

function useDistribution(initialWeights: number[]) {
  const [weights, setWeights] = useState(initialWeights);
  const probabilities = normalize(weights);
  const onDrag = (index: number, fraction: number) => {
    setWeights((prev) => prev.map((w, i) => (i === index ? fraction : w)));
  };
  return { probabilities, onDrag };
}

/** Intuition beat: no formula yet — just feel the difference between spread-out and lopsided. */
export function IntuitionDemo() {
  const { probabilities, onDrag } = useDistribution([0.5, 0.5, 0.5, 0.5]);
  return <DistributionPlayground labels={LABELS} probabilities={probabilities} onDrag={onDrag} />;
}

/** Play beat: same interaction, now with entropy read out live. */
export function PlayDemo() {
  const { probabilities, onDrag } = useDistribution([0.5, 0.5, 0.5, 0.5]);
  const h = entropy(probabilities);
  return (
    <DistributionPlayground
      labels={LABELS}
      probabilities={probabilities}
      onDrag={onDrag}
      readout={`H(X) = ${h.toFixed(2)} bits`}
    />
  );
}

/** Checkpoint: skew the distribution until entropy hits a specific target. */
export function EntropyCheckpoint() {
  const { probabilities, onDrag } = useDistribution([0.5, 0.5, 0.5, 0.5]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const h = entropy(probabilities);
  const passed = withinTolerance(h, TARGET_ENTROPY, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Reshape the distribution until <code>H(X)</code> reads (approximately) <strong>1.5 bits</strong>{" "}
          — down from the uniform maximum of 2.
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
        readout={`H(X) = ${h.toFixed(2)} bits`}
      />
    </CheckpointFrame>
  );
}
