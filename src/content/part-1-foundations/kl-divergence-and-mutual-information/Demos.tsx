"use client";

import { useEffect, useState } from "react";
import { DistributionPlayground } from "@/components/viz/DistributionPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { normalize } from "@/lib/math-core/probability";
import { P_REFERENCE, klDivergence } from "@/lib/math-core/kl-divergence-and-mutual-information";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const LABELS = ["A", "B", "C"];
const CONCEPT_ID = "kl-divergence-and-mutual-information";
const KL_TOLERANCE = 0.02;

function useQDistribution(initialWeights: number[]) {
  const [weights, setWeights] = useState(initialWeights);
  const probabilities = normalize(weights);
  const onDrag = (index: number, fraction: number) => {
    setWeights((prev) => prev.map((w, i) => (i === index ? fraction : w)));
  };
  return { probabilities, onDrag };
}

/** Intuition beat: P is fixed; drag Q and watch D_KL(P||Q) shrink as Q approaches P. */
export function IntuitionDemo() {
  const { probabilities: q, onDrag } = useQDistribution([0.4, 0.4, 0.2]);
  const kl = klDivergence(P_REFERENCE, q);
  return (
    <DistributionPlayground
      labels={LABELS}
      probabilities={q}
      onDrag={onDrag}
      readout={`P = (${P_REFERENCE.map((p) => p.toFixed(2)).join(", ")})  |  D_KL(P‖Q) = ${kl.toFixed(4)} bits`}
    />
  );
}

/** Play beat: also show D_KL(Q||P), the reversed divergence, to make the asymmetry visible. */
export function PlayDemo() {
  const { probabilities: q, onDrag } = useQDistribution([0.4, 0.4, 0.2]);
  const forward = klDivergence(P_REFERENCE, q);
  const backward = klDivergence(q, P_REFERENCE);
  return (
    <DistributionPlayground
      labels={LABELS}
      probabilities={q}
      onDrag={onDrag}
      readout={`D_KL(P‖Q) = ${forward.toFixed(4)}  |  D_KL(Q‖P) = ${backward.toFixed(4)} — not the same number`}
    />
  );
}

/** Checkpoint: reshape Q until D_KL(P||Q) drops below a small tolerance — i.e., match P closely enough. */
export function KLCheckpoint() {
  const { probabilities: q, onDrag } = useQDistribution([0.4, 0.4, 0.2]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const kl = klDivergence(P_REFERENCE, q);
  const passed = kl < KL_TOLERANCE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag <strong>Q</strong> until <code>D_KL(P‖Q)</code> drops under {KL_TOLERANCE} bits — i.e.,
          reshape it to closely match P = ({P_REFERENCE.map((p) => p.toFixed(1)).join(", ")}).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag a bar to try it"
    >
      <DistributionPlayground
        labels={LABELS}
        probabilities={q}
        onDrag={(i, f) => {
          setHasInteracted(true);
          onDrag(i, f);
        }}
        passed={passed}
        readout={`D_KL(P‖Q) = ${kl.toFixed(4)} bits`}
      />
    </CheckpointFrame>
  );
}
