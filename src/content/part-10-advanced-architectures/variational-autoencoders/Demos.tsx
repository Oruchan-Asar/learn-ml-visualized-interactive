"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { encodeMu, encodeLogVar, sampleReconstructions, klDivergence, EPSILON_SEQUENCE } from "@/lib/math-core/variational-autoencoders";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "variational-autoencoders";
const INPUT_X = 2;

/** Intuition beat: pick a noise value and watch the same input decode to a different point each time. */
export function IntuitionDemo() {
  const [epsilonIndex, setEpsilonIndex] = useState(0);
  const samples = sampleReconstructions(INPUT_X);
  const sample = samples[epsilonIndex];
  return (
    <>
      <div className={styles.buttons}>
        {EPSILON_SEQUENCE.map((eps, i) => (
          <button key={i} type="button" className={i === epsilonIndex ? styles.buttonActive : styles.button} onClick={() => setEpsilonIndex(i)}>
            ε={eps}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[{ label: `reconstruction (x=${INPUT_X})`, value: sample.reconstruction }]}
        formatValue={(v) => v.toFixed(4)}
        max={Math.max(...samples.map((s) => Math.abs(s.reconstruction)))}
        readout={`z = μ + σ·ε = ${sample.z.toFixed(4)} → decoded to ${sample.reconstruction.toFixed(4)}`}
      />
    </>
  );
}

/** Play beat: every noise draw for the same input, all at once — one input, a whole neighborhood of outputs. */
export function PlayDemo() {
  const samples = sampleReconstructions(INPUT_X);
  return (
    <ContributionBars
      items={samples.map((s) => ({ label: `ε=${s.epsilon}`, value: s.reconstruction }))}
      formatValue={(v) => v.toFixed(4)}
      readout={`x=${INPUT_X} → μ=${encodeMu(INPUT_X)}, but the decoded outputs scatter from ${Math.min(...samples.map((s) => s.reconstruction)).toFixed(2)} to ${Math.max(...samples.map((s) => s.reconstruction)).toFixed(2)}`}
    />
  );
}

/** Checkpoint: find the input value whose encoded distribution has KL divergence closest to zero. */
export function VAECheckpoint() {
  const [x, setX] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const candidates = [0, 2, 5];

  const kl = x === null ? null : klDivergence(encodeMu(x), encodeLogVar(x));
  const passed = kl !== null && kl === Math.min(...candidates.map((c) => klDivergence(encodeMu(c), encodeLogVar(c))));

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the input, among the three candidates, whose encoded distribution sits <strong>closest to the standard normal</strong> (lowest KL divergence).</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an input to try it"
    >
      <div className={styles.buttons}>
        {candidates.map((c) => (
          <button
            key={c}
            type="button"
            className={c === x ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setX(c);
            }}
          >
            x={c}
          </button>
        ))}
      </div>
      {kl !== null && (
        <ContributionBars
          items={[{ label: `KL divergence (x=${x})`, value: kl }]}
          formatValue={(v) => v.toFixed(4)}
          max={Math.max(...candidates.map((c) => klDivergence(encodeMu(c), encodeLogVar(c))))}
        />
      )}
    </CheckpointFrame>
  );
}
