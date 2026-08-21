"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { conditionedReverse, finalX0, UNCONDITIONAL_NOISE, CAT_NOISE, DOG_NOISE, SHARED_X_T, T } from "@/lib/math-core/text-conditioned-diffusion";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "text-conditioned-diffusion";
const CONDITIONS = [
  { label: "no caption", noise: UNCONDITIONAL_NOISE },
  { label: '"a cat"', noise: CAT_NOISE },
  { label: '"a dog"', noise: DOG_NOISE },
];

function toCurve(noise: number[], variant: CurveLine["variant"]): CurveLine {
  return { points: conditionedReverse(noise).map((s) => ({ x: s.t, y: s.value })), variant };
}

/** Intuition beat: pick a caption and watch the same starting noise reverse into a different final value. */
export function IntuitionDemo() {
  const [conditionIndex, setConditionIndex] = useState(0);
  const condition = CONDITIONS[conditionIndex];
  return (
    <>
      <div className={styles.buttons}>
        {CONDITIONS.map((c, i) => (
          <button key={c.label} type="button" className={i === conditionIndex ? styles.buttonActive : styles.button} onClick={() => setConditionIndex(i)}>
            {c.label}
          </button>
        ))}
      </div>
      <MultiCurvePlayground
        curves={[toCurve(condition.noise, "fitHighlight")]}
        domain={[0, T]}
        rangeDomain={[0, 5]}
        readout={`same starting noise (x_T=${SHARED_X_T}) → final value ${finalX0(condition.noise).toFixed(3)}`}
      />
    </>
  );
}

/** Play beat: all three conditioning trajectories at once, diverging from the exact same starting point. */
export function PlayDemo() {
  return (
    <>
      <MultiCurvePlayground
        curves={[toCurve(UNCONDITIONAL_NOISE, "true"), toCurve(CAT_NOISE, "fitHighlight"), toCurve(DOG_NOISE, "fit")]}
        domain={[0, T]}
        rangeDomain={[0, 5]}
        readout="unconditional (dashed), 'a cat' (bold), 'a dog' (faint) — one shared starting point, three diverging paths"
      />
      <ContributionBars
        items={CONDITIONS.map((c) => ({ label: c.label, value: finalX0(c.noise) }))}
        formatValue={(v) => v.toFixed(3)}
      />
    </>
  );
}

/** Checkpoint: find the caption that steers the reverse process to a final value ABOVE the unconditional baseline. */
export function DiffusionCheckpoint() {
  const [conditionIndex, setConditionIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const baseline = finalX0(UNCONDITIONAL_NOISE);
  const chosen = conditionIndex === null ? null : finalX0(CONDITIONS[conditionIndex].noise);
  const passed = chosen !== null && chosen > baseline;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the caption that steers the final value <strong>above</strong> the unconditional baseline ({baseline.toFixed(3)}).</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a caption to try it"
    >
      <div className={styles.buttons}>
        {CONDITIONS.map((c, i) => (
          <button
            key={c.label}
            type="button"
            className={i === conditionIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setConditionIndex(i);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {chosen !== null && <ContributionBars items={[{ label: "final value", value: chosen }]} formatValue={(v) => v.toFixed(3)} />}
    </CheckpointFrame>
  );
}
