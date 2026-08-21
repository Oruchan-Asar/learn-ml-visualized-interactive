"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { predict, perturb, ORIGINAL_INPUT, EPSILON_CANDIDATES, DIMENSIONS } from "@/lib/math-core/adversarial-examples-and-robustness";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "adversarial-examples-and-robustness";

function toGrid(x: number[]): number[][] {
  return [x.slice(0, 3), x.slice(3, 6), x.slice(6, 9)];
}

/** Intuition beat: drag epsilon and watch every pixel nudge by the same tiny amount, until confidence crosses 0.5. */
export function IntuitionDemo() {
  const [epsilon, setEpsilon] = useState(0);
  const perturbed = perturb(ORIGINAL_INPUT, epsilon);
  const confidence = predict(perturbed);

  return (
    <>
      <KernelHeatmap kernel={toGrid(perturbed)} width={160} label={`input, each pixel nudged by ${epsilon.toFixed(2)}`} />
      <ContributionBars
        items={[{ label: "P(positive class)", value: confidence }]}
        formatValue={(v) => v.toFixed(4)}
        max={1}
        readout={confidence >= 0.5 ? "still classified positive" : "classification flipped to negative"}
      />
      <label className={styles.sliderRow}>
        epsilon
        <input type="range" min={0} max={0.3} step={0.01} value={epsilon} onChange={(e) => setEpsilon(Number(e.target.value))} />
        {epsilon.toFixed(2)}
      </label>
    </>
  );
}

/** Play beat: confidence at every candidate epsilon — a small, steady decline that crosses the boundary once epsilon is large enough. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={EPSILON_CANDIDATES.map((eps) => ({ label: `ε = ${eps}`, value: predict(perturb(ORIGINAL_INPUT, eps)) }))}
      formatValue={(v) => v.toFixed(4)}
      max={1}
      readout={`each pixel moves by at most ${Math.max(...EPSILON_CANDIDATES)} — but the dot product moves by ${DIMENSIONS}× that, since all ${DIMENSIONS} dimensions shift together`}
    />
  );
}

/** Checkpoint: find the smallest epsilon, among the candidates, that actually flips the classification. */
export function AdversarialCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const smallestFlip = EPSILON_CANDIDATES.find((eps) => predict(perturb(ORIGINAL_INPUT, eps)) < 0.5);
  const passed = chosen !== null && chosen === smallestFlip;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the <strong>smallest</strong> epsilon, among the candidates, that actually flips the classification.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an epsilon to try it"
    >
      <div className={styles.buttons}>
        {EPSILON_CANDIDATES.map((eps) => (
          <button
            key={eps}
            type="button"
            className={eps === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(eps);
            }}
          >
            ε = {eps}
          </button>
        ))}
      </div>
      {chosen !== null && <ContributionBars items={[{ label: "confidence", value: predict(perturb(ORIGINAL_INPUT, chosen)) }]} formatValue={(v) => v.toFixed(4)} max={1} />}
    </CheckpointFrame>
  );
}
