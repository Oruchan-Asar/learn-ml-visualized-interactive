"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { elasticNetFit, LAMBDA, ALPHA_MIN, ALPHA_MAX } from "@/lib/math-core/elastic-net-regularization";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "elastic-net-regularization";
const BAR_MAX = 2.5;

function weightItems(w: { w1: number; w2: number }) {
  return [
    { label: "w₁ (predictor 1)", value: w.w1 },
    { label: "w₂ (predictor 2)", value: w.w2 },
  ];
}

function AlphaSlider({ value, onChange }: { value: number; onChange: (alpha: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>α = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={ALPHA_MIN}
        max={ALPHA_MAX}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: sweep α from pure lasso (1) to pure ridge (0) at a fixed λ, watching w2 revive from exact zero. */
export function IntuitionDemo() {
  const [alpha, setAlpha] = useState(1);
  const w = elasticNetFit(alpha, LAMBDA);
  return (
    <>
      <ContributionBars
        items={weightItems(w)}
        max={BAR_MAX}
        formatValue={(v) => v.toFixed(3)}
        readout={alpha === 1 ? "α=1: pure lasso" : alpha === 0 ? "α=0: pure ridge" : `α=${alpha.toFixed(2)}: a mix of both`}
      />
      <div className={styles.controls}>
        <AlphaSlider value={alpha} onChange={setAlpha} />
      </div>
    </>
  );
}

/** Play beat: same slider, with an explicit readout of where w2 sits relative to zero. */
export function PlayDemo() {
  const [alpha, setAlpha] = useState(0.5);
  const w = elasticNetFit(alpha, LAMBDA);
  return (
    <>
      <ContributionBars
        items={weightItems(w)}
        max={BAR_MAX}
        formatValue={(v) => v.toFixed(3)}
        readout={w.w2 === 0 ? "w₂ = 0.000 — the lasso side has fully won" : `w₂ = ${w.w2.toFixed(3)} — both predictors kept, grouped together`}
      />
      <div className={styles.controls}>
        <AlphaSlider value={alpha} onChange={setAlpha} />
      </div>
    </>
  );
}

/** Checkpoint: find the alpha where w2 first becomes nonzero — the L1-sparsity boundary. */
export function ElasticNetCheckpoint() {
  const [alpha, setAlpha] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const w = elasticNetFit(alpha, LAMBDA);
  const passed = w.w2 > 0.5;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Lower α from pure lasso until <strong>w₂</strong> climbs back above <strong>0.5</strong> — enough
          L2 influence to bring the zeroed predictor back into the model.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the α slider to try it"
    >
      <ContributionBars
        items={weightItems(w)}
        max={BAR_MAX}
        formatValue={(v) => v.toFixed(3)}
        readout={`w₁ = ${w.w1.toFixed(3)}, w₂ = ${w.w2.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <AlphaSlider
          value={alpha}
          onChange={(a) => {
            setHasInteracted(true);
            setAlpha(a);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
