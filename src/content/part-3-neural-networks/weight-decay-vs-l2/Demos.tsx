"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  l2CoupledDecay,
  decoupledDecay,
  W1,
  W2,
  V1,
  V2,
  LAMBDA_DOMAIN,
  DESTRUCTIVE_FRACTION,
  SAFE_FRACTION,
} from "@/lib/math-core/weight-decay-vs-l2";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "weight-decay-vs-l2";
const BAR_MAX = 1;

function decayItems(lambda: number) {
  return [
    { label: "w₁ coupled (L2-in-Adam)", value: l2CoupledDecay(W1, V1, lambda) },
    { label: "w₂ coupled (L2-in-Adam)", value: l2CoupledDecay(W2, V2, lambda) },
    { label: "w₁ decoupled (AdamW)", value: decoupledDecay(W1, lambda) },
    { label: "w₂ decoupled (AdamW)", value: decoupledDecay(W2, lambda) },
  ];
}

function LambdaSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>λ = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={LAMBDA_DOMAIN[0]}
        max={LAMBDA_DOMAIN[1]}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: same lambda, four decay amounts — w1 (rarely updated) and w2 (frequently updated) get treated very differently by coupled L2, but identically by decoupled decay. */
export function IntuitionDemo() {
  const [lambda, setLambda] = useState(0.3);
  return (
    <>
      <ContributionBars
        items={decayItems(lambda)}
        max={BAR_MAX}
        formatValue={(v) => v.toFixed(4)}
        readout={`w₁ has a small gradient history (v=${V1}), w₂ has a large one (v=${V2}) — same λ, same starting weight`}
      />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Play beat: push lambda up and watch the coupled bars spread apart while the decoupled bars stay glued together. */
export function PlayDemo() {
  const [lambda, setLambda] = useState(0.6);
  const coupledGap = Math.abs(l2CoupledDecay(W1, V1, lambda) - l2CoupledDecay(W2, V2, lambda));
  const decoupledGap = Math.abs(decoupledDecay(W1, lambda) - decoupledDecay(W2, lambda));
  return (
    <>
      <ContributionBars
        items={decayItems(lambda)}
        max={BAR_MAX}
        formatValue={(v) => v.toFixed(4)}
        readout={`coupled gap (w₁ − w₂) = ${coupledGap.toFixed(4)}  |  decoupled gap = ${decoupledGap.toFixed(4)}`}
      />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Checkpoint: find a lambda that would destructively shrink w1 under coupled L2, yet stays safely small under decoupled decay. */
export function WeightDecayCheckpoint() {
  const [lambda, setLambda] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const coupledW1 = l2CoupledDecay(W1, V1, lambda);
  const decoupledW1 = decoupledDecay(W1, lambda);
  const destructive = coupledW1 >= DESTRUCTIVE_FRACTION * W1;
  const safe = decoupledW1 < SAFE_FRACTION * W1;
  const passed = destructive && safe;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Raise λ until coupled L2 would shrink w₁ by at least <strong>{DESTRUCTIVE_FRACTION * 100}%</strong> in a
          single step, while decoupled decay on that same w₁ stays under <strong>{SAFE_FRACTION * 100}%</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the λ slider to try it"
    >
      <ContributionBars
        items={decayItems(lambda)}
        max={BAR_MAX}
        formatValue={(v) => v.toFixed(4)}
        readout={`w₁ coupled decay = ${coupledW1.toFixed(4)} (destructive: ${destructive ? "yes" : "no"})  |  w₁ decoupled decay = ${decoupledW1.toFixed(4)} (safe: ${safe ? "yes" : "no"})`}
      />
      <div className={styles.controls}>
        <LambdaSlider
          value={lambda}
          onChange={(v) => {
            setHasInteracted(true);
            setLambda(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
