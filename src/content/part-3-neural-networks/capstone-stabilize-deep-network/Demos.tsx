"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  DEPTH,
  SAMPLE_LAYERS,
  HEALTHY_FLOOR,
  UNSAFE_UPDATE_THRESHOLD,
  WEIGHT_BOUND,
  gradientMagnitudes,
  sampledGradientMagnitudes,
  step0UpdateSize,
  weightAfterSteps,
  isHealthy,
  type Toggles,
} from "@/lib/math-core/capstone-stabilize-deep-network";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./Toggles.module.css";

const CONCEPT_ID = "capstone-stabilize-deep-network";

const ALL_OFF: Toggles = { normalize: false, lossScaling: false, warmup: false, weightDecay: false };

const LAYER_LABELS = SAMPLE_LAYERS.map((l) => (l === 0 ? "input" : l === DEPTH ? "output" : `layer ${l}`));

/** Every sampled layer's raw (full-precision) gradient magnitude -- no fp16 storage involved yet. */
function rawSampledMagnitudes(useNorm: boolean): number[] {
  const full = gradientMagnitudes(useNorm);
  return SAMPLE_LAYERS.map((l) => full[l]);
}

function contributionItems(values: number[]) {
  return values.map((v, i) => ({ label: LAYER_LABELS[i], value: v }));
}

const FIXES: { id: keyof Toggles; label: string; source: string }[] = [
  { id: "normalize", label: "RMSNorm after every layer", source: "rmsnorm" },
  { id: "warmup", label: "LR warmup before cosine decay", source: "learning-rate-schedules" },
  { id: "weightDecay", label: "Decoupled weight decay", source: "weight-decay-vs-l2" },
  { id: "lossScaling", label: "Dynamic loss scaling (fp16)", source: "mixed-precision-training" },
];

function FixToggles({ toggles, onToggle }: { toggles: Toggles; onToggle: (id: keyof Toggles) => void }) {
  return (
    <div className={styles.list}>
      {FIXES.map((f) => (
        <label className={styles.row} key={f.id}>
          <span>
            <input type="checkbox" checked={toggles[f.id]} onChange={() => onToggle(f.id)} />
            {f.label}
          </span>
          <span className={styles.source}>{f.source}</span>
        </label>
      ))}
    </div>
  );
}

/** Intuition beat: one lever (RMSNorm) -- watch every bar past the first few layers go from invisible to healthy. */
export function IntuitionDemo() {
  const [normalize, setNormalize] = useState(false);
  const values = rawSampledMagnitudes(normalize);

  return (
    <>
      <label className={styles.row} style={{ marginBottom: 10 }}>
        <span>
          <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} />
          Add RMSNorm after every layer
        </span>
      </label>
      <ContributionBars
        items={contributionItems(values)}
        formatValue={(v) => v.toExponential(1)}
        max={1}
        readout={`gradient reaching the input ${normalize ? "stays" : "shrinks to"} ${values[0].toExponential(1)}`}
      />
    </>
  );
}

/** Play beat: all four fixes, live -- gradient bars, the first update's size, and the weight after training. */
export function PlayDemo() {
  const [toggles, setToggles] = useState<Toggles>(ALL_OFF);
  const toggle = (id: keyof Toggles) => setToggles((t) => ({ ...t, [id]: !t[id] }));

  const bars = sampledGradientMagnitudes(toggles.normalize, toggles.lossScaling);
  const rawInputGrad = gradientMagnitudes(toggles.normalize)[0];
  const update = step0UpdateSize(toggles.warmup, rawInputGrad);
  const weight = weightAfterSteps(toggles.weightDecay);
  const healthy = isHealthy(toggles);

  return (
    <>
      <FixToggles toggles={toggles} onToggle={toggle} />
      <ContributionBars
        items={contributionItems(bars)}
        formatValue={(v) => v.toExponential(1)}
        max={1}
        readout={`gradient at the input ≈ ${bars[0].toExponential(1)} (healthy floor ${HEALTHY_FLOOR})`}
      />
      <p className={styles.status}>
        step-0 update ≈ {update.toFixed(3)} (unsafe above {UNSAFE_UPDATE_THRESHOLD}) · weight after 50 steps ≈ {weight.toFixed(2)}{" "}
        (bound {WEIGHT_BOUND})
      </p>
      <p className={healthy ? styles.statusGood : styles.statusBad}>{healthy ? "✓ network is healthy" : "✗ still unstable"}</p>
    </>
  );
}

/** Checkpoint: flip fixes on until the network clears every one of its three failure modes at once. */
export function StabilizeCheckpoint() {
  const [toggles, setToggles] = useState<Toggles>(ALL_OFF);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const bars = sampledGradientMagnitudes(toggles.normalize, toggles.lossScaling);
  const rawInputGrad = gradientMagnitudes(toggles.normalize)[0];
  const update = step0UpdateSize(toggles.warmup, rawInputGrad);
  const weight = weightAfterSteps(toggles.weightDecay);
  const passed = isHealthy(toggles);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Flip fixes on until the gradient reaching the input clears <strong>{HEALTHY_FLOOR}</strong>, the first
          update stays under <strong>{UNSAFE_UPDATE_THRESHOLD}</strong>, and the weight after training stays under{" "}
          <strong>{WEIGHT_BOUND}</strong> -- all at once.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Toggle a fix to try it"
    >
      <FixToggles
        toggles={toggles}
        onToggle={(id) => {
          setHasInteracted(true);
          setToggles((t) => ({ ...t, [id]: !t[id] }));
        }}
      />
      <ContributionBars
        items={contributionItems(bars)}
        formatValue={(v) => v.toExponential(1)}
        max={1}
        readout={`gradient at the input ≈ ${bars[0].toExponential(1)}`}
      />
      <p className={styles.status}>
        step-0 update ≈ {update.toFixed(3)} · weight after 50 steps ≈ {weight.toFixed(2)}
      </p>
    </CheckpointFrame>
  );
}
