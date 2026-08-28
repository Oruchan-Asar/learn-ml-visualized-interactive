"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { GaussianScene } from "@/components/viz/GaussianScene";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import {
  projectedSigma,
  blendOverBackground,
  squaredErrorLoss,
  opacityGradient,
  gradientDescentStep,
  TRAIN_COLOR,
  TRAIN_TARGET,
  TRAIN_INITIAL_OPACITY,
  CHECKPOINT_TARGET_OPACITY,
  CHECKPOINT_TOLERANCE,
  type RGB,
} from "@/lib/math-core/rasterization-and-optimization-in-3dgs";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "rasterization-and-optimization-in-3dgs";

function toCss(c: RGB): string {
  return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
}

function Swatch({ color }: { color: RGB }) {
  return <div aria-hidden="true" style={{ width: 48, height: 24, borderRadius: 4, border: "1px solid var(--line)", background: toCss(color) }} />;
}

/** Intuition beat: drag depth and watch a single Gaussian's projected screen-space spread shrink. No formula shown yet. */
export function IntuitionDemo() {
  const [depth, setDepth] = useState(10);
  const sigmaWorld = 1;
  const focal = 100;
  const sigma2D = projectedSigma(sigmaWorld, focal, depth);

  return (
    <>
      <GaussianScene
        gaussians={[{ mu: { x: 0, y: 0 }, sigma: { x: sigma2D, y: sigma2D }, opacity: 0.7, color: { r: 0.3, g: 0.5, b: 0.9 }, label: "screen-space blob" }]}
        domain={[-15, 15]}
        readout={`world spread stays fixed at 1 — only depth changes. Projected spread ≈ ${sigma2D.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label>depth: {depth.toFixed(0)}</label>
          <input type="range" min={5} max={40} step={1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
        </div>
      </div>
    </>
  );
}

const PLAY_LR = 0.15;
const PLAY_STEPS = 6;

function buildOptimizationTrace(): { opacity: number; loss: number; rendered: RGB }[] {
  const trace: { opacity: number; loss: number; rendered: RGB }[] = [];
  let opacity = TRAIN_INITIAL_OPACITY;
  for (let i = 0; i < PLAY_STEPS; i++) {
    const rendered = blendOverBackground(opacity, TRAIN_COLOR);
    const loss = squaredErrorLoss(rendered, TRAIN_TARGET);
    trace.push({ opacity, loss, rendered });
    const grad = opacityGradient(opacity, TRAIN_COLOR, TRAIN_TARGET);
    opacity = gradientDescentStep(opacity, grad, PLAY_LR);
  }
  return trace;
}

/** Play beat: step through a Gaussian's opacity being optimized by gradient descent toward a target pixel color. */
export function PlayDemo() {
  const trace = useMemo(() => buildOptimizationTrace(), []);
  const [step, setStep] = useState(0);
  const current = trace[step];

  return (
    <>
      <div className={styles.controls}>
        <span className={styles.stepCount}>
          step {step + 1} of {PLAY_STEPS} — opacity = {current.opacity.toFixed(3)}, loss = {current.loss.toFixed(4)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>rendered</span>
          <Swatch color={current.rendered} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>target</span>
          <Swatch color={TRAIN_TARGET} />
        </div>
      </div>
      <ContributionBars
        items={[{ label: "loss", value: current.loss }]}
        max={trace[0].loss}
        formatValue={(v) => v.toFixed(4)}
        readout="each step nudges opacity directly by gradient descent against the rendering loss — no network, no ray march, just this one parameter."
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          ← prev step
        </button>
        <button type="button" className={styles.button} disabled={step === PLAY_STEPS - 1} onClick={() => setStep((s) => Math.min(PLAY_STEPS - 1, s + 1))}>
          next step →
        </button>
      </div>
    </>
  );
}

/** Checkpoint: drag the learning rate until one gradient step from the initial opacity lands on the target. */
export function RasterizationCheckpoint() {
  const id = useId();
  const [lr, setLr] = useState(0.05);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const grad = opacityGradient(TRAIN_INITIAL_OPACITY, TRAIN_COLOR, TRAIN_TARGET);
  const nextOpacity = gradientDescentStep(TRAIN_INITIAL_OPACITY, grad, lr);
  const passed = withinTolerance(nextOpacity, CHECKPOINT_TARGET_OPACITY, CHECKPOINT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const rendered = blendOverBackground(nextOpacity, TRAIN_COLOR);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the learning rate until <strong>one</strong> gradient step from the starting opacity (
          {TRAIN_INITIAL_OPACITY}) lands on <strong>≈ {CHECKPOINT_TARGET_OPACITY}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the learning rate to try it"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Swatch color={rendered} />
        <Swatch color={TRAIN_TARGET} />
      </div>
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label htmlFor={id}>learning rate: {lr.toFixed(3)}</label>
          <input
            id={id}
            type="range"
            min={0}
            max={0.5}
            step={0.005}
            value={lr}
            onChange={(e) => {
              setHasInteracted(true);
              setLr(Number(e.target.value));
            }}
          />
        </div>
      </div>
      <div className={styles.controls}>
        <span className={styles.stepCount}>gradient = {grad.toFixed(3)}, next opacity = {nextOpacity.toFixed(3)}</span>
      </div>
    </CheckpointFrame>
  );
}
