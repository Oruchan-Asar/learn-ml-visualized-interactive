"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { f, gradient } from "@/lib/math-core/multivariable";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const DOMAIN: [number, number] = [-6, 6];
const START = { x: 4, y: -3 };
const CONCEPT_ID = "gradient-in-multiple-dimensions";
const TOLERANCE = 0.5;

/** Intuition beat: just the bowl and the arrow, no numbers yet. */
export function IntuitionDemo() {
  const [p, setP] = useState(START);
  return <ContourPlayground fn={f} gradient={gradient} domain={DOMAIN} value={p} onChange={setP} />;
}

/** Play beat: same interaction, now with the gradient's components and magnitude read out live. */
export function PlayDemo() {
  const [p, setP] = useState(START);
  const g = gradient(p.x, p.y);
  const mag = Math.hypot(g.x, g.y);
  return (
    <ContourPlayground
      fn={f}
      gradient={gradient}
      domain={DOMAIN}
      value={p}
      onChange={setP}
      readout={`∇f = (${g.x.toFixed(1)}, ${g.y.toFixed(1)}), |∇f| = ${mag.toFixed(1)}`}
    />
  );
}

/** Checkpoint: drag until the gradient is (approximately) the zero vector — the bottom of the bowl. */
export function GradientCheckpoint() {
  const [p, setP] = useState(START);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const g = gradient(p.x, p.y);
  const passed = withinDistance(g, { x: 0, y: 0 }, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the point until <code>∇f</code> reads (approximately) <strong>(0, 0)</strong> — the flat
          spot at the bottom of the bowl.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={DOMAIN}
        value={p}
        onChange={(next) => {
          setHasInteracted(true);
          setP(next);
        }}
        passed={passed}
        readout={`∇f = (${g.x.toFixed(1)}, ${g.y.toFixed(1)})`}
      />
    </CheckpointFrame>
  );
}
