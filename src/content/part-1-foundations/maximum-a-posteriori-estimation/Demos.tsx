"use client";

import { useEffect, useMemo, useState } from "react";
import { MultiCurvePlayground } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  FLIPS,
  PRIOR_ALPHA,
  PRIOR_BETA,
  headsCount,
  mleEstimate,
  priorMean,
  logLikelihood,
  logPosterior,
  mapEstimate,
} from "@/lib/math-core/maximum-a-posteriori-estimation";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import flipStyles from "../maximum-likelihood-estimation/Flips.module.css";
import candidateStyles from "./Candidates.module.css";

const CONCEPT_ID = "maximum-a-posteriori-estimation";
const MLE = mleEstimate(FLIPS);
const HEADS = headsCount(FLIPS);
const MAP_FIXED = mapEstimate(FLIPS, PRIOR_ALPHA, PRIOR_BETA);
const PRIOR_MEAN = priorMean(PRIOR_ALPHA, PRIOR_BETA);

const LIKELIHOOD_CURVE = Array.from({ length: 19 }, (_, i) => {
  const p = 0.05 + i * 0.05;
  return { x: p, y: logLikelihood(p, FLIPS) };
});

function FlipsRow() {
  return (
    <div className={flipStyles.flips}>
      {FLIPS.map((f, i) => (
        <span key={i} className={f === 1 ? flipStyles.heads : flipStyles.tails}>
          {f === 1 ? "H" : "T"}
        </span>
      ))}
    </div>
  );
}

function strengthToPrior(strength: number): { alpha: number; beta: number } {
  return { alpha: 1 + strength, beta: 1 + 3 * strength };
}

function StrengthSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className={styles.sliderRow}>
      prior strength
      <input type="range" min={0} max={3} step={0.5} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {value === 0 ? "none (uniform prior)" : value.toFixed(1)}
    </label>
  );
}

/** Intuition beat: dial up how strongly the tails-favoring prior is believed, and watch the posterior peak slide. */
export function IntuitionDemo() {
  const [strength, setStrength] = useState(1);
  const { alpha, beta } = strengthToPrior(strength);
  const posteriorCurve = useMemo(
    () => Array.from({ length: 19 }, (_, i) => {
      const p = 0.05 + i * 0.05;
      return { x: p, y: logPosterior(p, FLIPS, alpha, beta) };
    }),
    [alpha, beta],
  );
  const map = mapEstimate(FLIPS, alpha, beta);
  return (
    <>
      <FlipsRow />
      <MultiCurvePlayground
        curves={[
          { points: LIKELIHOOD_CURVE, variant: "fit" },
          { points: posteriorCurve, variant: "fitHighlight" },
        ]}
        domain={[0.05, 0.95]}
        rangeDomain={[-13, -2]}
        scatterPoints={[
          { x: MLE, y: logLikelihood(MLE, FLIPS) },
          { x: map, y: logPosterior(map, FLIPS, alpha, beta) },
        ]}
        readout={`MLE p=${MLE.toFixed(2)} (faint curve) vs. MAP p=${map.toFixed(3)} (bold curve, α=${alpha}, β=${beta})`}
      />
      <StrengthSlider value={strength} onChange={setStrength} />
    </>
  );
}

/** Play beat: same slider, now reporting the prior's own mean alongside the two estimates. */
export function PlayDemo() {
  const [strength, setStrength] = useState(1);
  const { alpha, beta } = strengthToPrior(strength);
  const posteriorCurve = useMemo(
    () => Array.from({ length: 19 }, (_, i) => {
      const p = 0.05 + i * 0.05;
      return { x: p, y: logPosterior(p, FLIPS, alpha, beta) };
    }),
    [alpha, beta],
  );
  const map = mapEstimate(FLIPS, alpha, beta);
  const pMean = priorMean(alpha, beta);
  return (
    <>
      <FlipsRow />
      <MultiCurvePlayground
        curves={[
          { points: LIKELIHOOD_CURVE, variant: "fit" },
          { points: posteriorCurve, variant: "fitHighlight" },
        ]}
        domain={[0.05, 0.95]}
        rangeDomain={[-13, -2]}
        scatterPoints={[
          { x: MLE, y: logLikelihood(MLE, FLIPS) },
          { x: map, y: logPosterior(map, FLIPS, alpha, beta) },
        ]}
        readout={`prior mean=${pMean.toFixed(3)}, MLE=${MLE.toFixed(2)}, MAP=${map.toFixed(3)} — MAP sits between the prior mean and the MLE`}
      />
      <StrengthSlider value={strength} onChange={setStrength} />
    </>
  );
}

const CANDIDATES = [
  { label: "0.5", value: 0.5 },
  { label: "0.75", value: 0.75 },
  { label: "0.333", value: 1 / 3 },
  { label: "0.6", value: 0.6 },
];

/** Checkpoint: with the canonical Beta(2,4) prior fixed, pick the actual MAP estimate — not the MLE, not the prior mean. */
export function MapCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen !== null && Math.abs(chosen - MAP_FIXED) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          {HEADS} heads out of {FLIPS.length} flips, with a Beta(α=2, β=4) prior (mean {PRIOR_MEAN.toFixed(3)}).
          What is the <strong>MAP estimate</strong> of p?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <FlipsRow />
      <div className={candidateStyles.candidateList}>
        {CANDIDATES.map((c) => (
          <button
            key={c.label}
            type="button"
            className={chosen === c.value ? candidateStyles.candidateActive : candidateStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c.value);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
