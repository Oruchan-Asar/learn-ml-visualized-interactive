"use client";

import { useEffect, useId, useState } from "react";
import { GaussianScene } from "@/components/viz/GaussianScene";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import {
  compositePixel,
  GAUSSIAN_A,
  GAUSSIAN_B,
  QUERY_PIXEL,
  CHECKPOINT_TARGET_ALPHA,
  CHECKPOINT_TOLERANCE,
  type Gaussian2D,
  type RGB,
} from "@/lib/math-core/3d-gaussian-splatting-fundamentals";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "3d-gaussian-splatting-fundamentals";
const DOMAIN: [number, number] = [-6, 6];

function toCss(c: RGB): string {
  return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
}

function Slider({ label, value, onChange, min = 0, max = 1, step = 0.01 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  const id = useId();
  return (
    <div className={styles.controls}>
      <div className={styles.sliderRow}>
        <label htmlFor={id}>{label}</label>
        <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    </div>
  );
}

/** Intuition beat: drag Gaussian B's center and watch the query pixel's blended color shift as overlap changes. */
export function IntuitionDemo() {
  const [muB, setMuB] = useState(GAUSSIAN_B.mu);
  const b: Gaussian2D = { ...GAUSSIAN_B, mu: muB };
  const { color, alpha } = compositePixel(QUERY_PIXEL.x, QUERY_PIXEL.y, [GAUSSIAN_A, b]);

  return (
    <>
      <GaussianScene
        gaussians={[
          { ...b, draggable: true, label: "B" },
          { ...GAUSSIAN_A, label: "A" },
        ]}
        onChangeMu={(_, next) => setMuB(next)}
        queryPoint={QUERY_PIXEL}
        queryColor={color}
        domain={DOMAIN}
        readout={`query pixel's coverage (alpha) ≈ ${alpha.toFixed(2)} — drag B away and the pixel settles back to pure red`}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-soft)" }}>composited pixel:</span>
        <div aria-hidden="true" style={{ width: 48, height: 24, borderRadius: 4, border: "1px solid var(--line)", background: toCss(color) }} />
      </div>
    </>
  );
}

/** Play beat: opacity and spread sliders drive the same falloff formula the Formalize beat just named. */
export function PlayDemo() {
  const [opacityB, setOpacityB] = useState(GAUSSIAN_B.opacity);
  const [sigmaB, setSigmaB] = useState(GAUSSIAN_B.sigma.x);
  const b: Gaussian2D = { ...GAUSSIAN_B, opacity: opacityB, sigma: { x: sigmaB, y: sigmaB } };
  const { color, contributions, alpha } = compositePixel(QUERY_PIXEL.x, QUERY_PIXEL.y, [GAUSSIAN_A, b]);
  const items = [
    { label: "A (red, near)", value: contributions[0] },
    { label: "B (blue, far)", value: contributions[1] },
  ];

  return (
    <>
      <GaussianScene
        gaussians={[
          { ...b, label: "B" },
          { ...GAUSSIAN_A, label: "A" },
        ]}
        queryPoint={QUERY_PIXEL}
        queryColor={color}
        domain={DOMAIN}
        readout={`alpha(B) = ${opacityB.toFixed(2)} x weight(sigma=${sigmaB.toFixed(1)}) — total coverage ≈ ${alpha.toFixed(2)}`}
      />
      <ContributionBars
        items={items}
        max={1}
        readout="each Gaussian's actual contribution = its own alpha x however much of the pixel earlier (nearer) Gaussians left transparent"
      />
      <Slider label={`Gaussian B opacity: ${opacityB.toFixed(2)}`} value={opacityB} onChange={setOpacityB} />
      <Slider label={`Gaussian B spread (sigma): ${sigmaB.toFixed(1)}`} value={sigmaB} onChange={setSigmaB} min={0.5} max={4} step={0.1} />
    </>
  );
}

/** Checkpoint: drag Gaussian B's opacity (centers and spread fixed) until total alpha hits the target. */
export function GaussianSplattingCheckpoint() {
  const [opacityB, setOpacityB] = useState(0.3);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const b: Gaussian2D = { ...GAUSSIAN_B, opacity: opacityB };
  const { color, contributions, alpha } = compositePixel(QUERY_PIXEL.x, QUERY_PIXEL.y, [GAUSSIAN_A, b]);
  const passed = withinTolerance(alpha, CHECKPOINT_TARGET_ALPHA, CHECKPOINT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag Gaussian B&apos;s opacity until the composited pixel&apos;s total alpha (coverage) reaches{" "}
          <strong>≈ {CHECKPOINT_TARGET_ALPHA}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag Gaussian B's opacity to try it"
    >
      <GaussianScene
        gaussians={[
          { ...b, label: "B" },
          { ...GAUSSIAN_A, label: "A" },
        ]}
        queryPoint={QUERY_PIXEL}
        queryColor={color}
        domain={DOMAIN}
        readout={`alpha = ${alpha.toFixed(3)}`}
      />
      <ContributionBars
        items={[
          { label: "A", value: contributions[0] },
          { label: "B", value: contributions[1] },
        ]}
        max={1}
      />
      <Slider
        label={`Gaussian B opacity: ${opacityB.toFixed(2)}`}
        value={opacityB}
        onChange={(v) => {
          setHasInteracted(true);
          setOpacityB(v);
        }}
      />
    </CheckpointFrame>
  );
}
