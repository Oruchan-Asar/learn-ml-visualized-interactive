"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import {
  alphaFromDensity,
  sampleWeights,
  compositeColor,
  DEFAULT_SAMPLES,
  CHECKPOINT_TARGET_WEIGHT,
  CHECKPOINT_TOLERANCE,
  type RaySample,
} from "@/lib/math-core/neural-radiance-fields-nerf";

const CONCEPT_ID = "neural-radiance-fields-nerf";

function toCss([r, g, b]: [number, number, number]): string {
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

const sampleDotStyle = (color: [number, number, number], highlighted: boolean): CSSProperties => ({
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: toCss(color),
  border: highlighted ? "3px solid var(--accent)" : "1px solid var(--line)",
  boxShadow: "var(--shadow)",
});

/** A tiny "ray" of samples between the camera and a far surface, near-to-far left to right. */
function RayView({ samples, alphas, highlightIndex }: { samples: RaySample[]; alphas: number[]; highlightIndex?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 4px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>camera</span>
      <div style={{ width: 28, height: 2, background: "var(--line)" }} />
      {samples.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={sampleDotStyle(s.color, i === highlightIndex)} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)" }}>
              α{i + 1} = {alphas[i].toFixed(2)}
            </span>
          </div>
          {i < samples.length - 1 && <div style={{ width: 28, height: 2, background: "var(--line)" }} />}
        </div>
      ))}
    </div>
  );
}

function AlphaSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
      <label htmlFor={id} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-soft)" }}>
        {label}
      </label>
      <input id={id} type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function weightItems(samples: RaySample[], alphas: number[]) {
  const weights = sampleWeights(alphas);
  return samples.map((s, i) => ({ label: `sample ${i + 1} (${["red", "green", "blue"][i]})`, value: weights[i] }));
}

/** Intuition beat: drag sample 1's opacity and watch it steal weight from everything behind it. */
export function IntuitionDemo() {
  const [alpha1, setAlpha1] = useState(DEFAULT_SAMPLES[0].alpha);
  const alphas = [alpha1, DEFAULT_SAMPLES[1].alpha, DEFAULT_SAMPLES[2].alpha];

  return (
    <>
      <RayView samples={DEFAULT_SAMPLES} alphas={alphas} highlightIndex={0} />
      <ContributionBars
        items={weightItems(DEFAULT_SAMPLES, alphas)}
        max={1}
        readout="Each sample's final contribution = how opaque it is x how much light survived past everything nearer."
      />
      <AlphaSlider label="sample 1 opacity" value={alpha1} onChange={setAlpha1} />
    </>
  );
}

/** Play beat: control sample 1 via density and step size (the actual NeRF formula), see the composited color. */
export function PlayDemo() {
  const [sigma, setSigma] = useState(1);
  const delta = 1;
  const alpha1 = alphaFromDensity(sigma, delta);
  const alphas = [alpha1, DEFAULT_SAMPLES[1].alpha, DEFAULT_SAMPLES[2].alpha];
  const samples: RaySample[] = [{ alpha: alpha1, color: DEFAULT_SAMPLES[0].color }, DEFAULT_SAMPLES[1], DEFAULT_SAMPLES[2]];
  const color = compositeColor(samples);

  return (
    <>
      <RayView samples={DEFAULT_SAMPLES} alphas={alphas} highlightIndex={0} />
      <ContributionBars
        items={weightItems(DEFAULT_SAMPLES, alphas)}
        max={1}
        readout={`α₁ = 1 - e^(-${sigma.toFixed(2)} x ${delta}) = ${alpha1.toFixed(3)}  →  composited color ≈ (${color[0].toFixed(2)}, ${color[1].toFixed(2)}, ${color[2].toFixed(2)})`}
      />
      <div
        aria-hidden="true"
        style={{ width: 48, height: 24, marginTop: 8, borderRadius: 4, border: "1px solid var(--line)", background: toCss(color) }}
      />
      <AlphaSlider label="sample 1 density (σ)" value={sigma} onChange={setSigma} />
    </>
  );
}

/** Checkpoint: drag sample 1's opacity until the far, fully-opaque sample's weight hits the target. */
export function NerfCheckpoint() {
  const [alpha1, setAlpha1] = useState(0.9);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const alphas = [alpha1, DEFAULT_SAMPLES[1].alpha, DEFAULT_SAMPLES[2].alpha];
  const weights = sampleWeights(alphas);
  const passed = withinTolerance(weights[2], CHECKPOINT_TARGET_WEIGHT, CHECKPOINT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag sample 1&apos;s opacity until the far, fully-opaque sample (sample 3) receives{" "}
          <strong>≈ {CHECKPOINT_TARGET_WEIGHT}</strong> of the final color&apos;s weight.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag sample 1's opacity to try it"
    >
      <RayView samples={DEFAULT_SAMPLES} alphas={alphas} highlightIndex={0} />
      <ContributionBars items={weightItems(DEFAULT_SAMPLES, alphas)} max={1} readout={`sample 3 weight = ${weights[2].toFixed(3)}`} />
      <AlphaSlider
        label="sample 1 opacity"
        value={alpha1}
        onChange={(v) => {
          setHasInteracted(true);
          setAlpha1(v);
        }}
      />
    </CheckpointFrame>
  );
}
