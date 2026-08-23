"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  bowl,
  bowlGradient,
  landscape,
  landscapeGradient,
  landscapeHessian,
  classifyCriticalPoint,
  DOMAIN,
  GRADIENT_ZERO_TOLERANCE,
} from "@/lib/math-core/convexity-and-optimization-landscapes";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "convexity-and-optimization-landscapes";
const START = { x: 0.6, y: 0.6 };

/** Intuition beat: just the non-convex landscape — drag around and feel the two dips and the ridge between. */
export function IntuitionDemo() {
  const [p, setP] = useState(START);
  const g = landscapeGradient(p.x, p.y);
  return (
    <ContourPlayground
      fn={landscape}
      gradient={landscapeGradient}
      domain={DOMAIN}
      value={p}
      onChange={setP}
      readout={`f(x,y) = ${landscape(p.x, p.y).toFixed(2)}, |∇f| = ${Math.hypot(g.x, g.y).toFixed(2)}`}
    />
  );
}

/** Play beat: toggle bowl vs landscape, and classify whatever critical point you land near via the Hessian test. */
export function PlayDemo() {
  const [mode, setMode] = useState<"bowl" | "landscape">("landscape");
  const [p, setP] = useState(START);
  const fn = mode === "bowl" ? bowl : landscape;
  const gradient = mode === "bowl" ? bowlGradient : landscapeGradient;
  const g = gradient(p.x, p.y);
  const gradMag = Math.hypot(g.x, g.y);
  const nearCritical = gradMag < GRADIENT_ZERO_TOLERANCE;
  const classification =
    mode === "bowl" ? "minimum" : classifyCriticalPoint(landscapeHessian(p.x));

  return (
    <>
      <ContourPlayground
        fn={fn}
        gradient={gradient}
        domain={DOMAIN}
        value={p}
        onChange={setP}
        readout={`f = ${fn(p.x, p.y).toFixed(2)}, |∇f| = ${gradMag.toFixed(2)}${
          nearCritical ? ` — critical point: ${classification}` : ""
        }`}
      />
      <div className={styles.buttons}>
        <button
          type="button"
          className={mode === "bowl" ? styles.buttonActive : styles.button}
          onClick={() => {
            setMode("bowl");
            setP({ x: 1.5, y: 1.2 });
          }}
        >
          Convex bowl
        </button>
        <button
          type="button"
          className={mode === "landscape" ? styles.buttonActive : styles.button}
          onClick={() => {
            setMode("landscape");
            setP(START);
          }}
        >
          Non-convex landscape
        </button>
      </div>
    </>
  );
}

/** Checkpoint: drag to the landscape's saddle point — where ∇f≈0 but the Hessian test says "saddle", not a minimum. */
export function LandscapeCheckpoint() {
  const [p, setP] = useState(START);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const g = landscapeGradient(p.x, p.y);
  const gradMag = Math.hypot(g.x, g.y);
  const isCritical = gradMag < GRADIENT_ZERO_TOLERANCE;
  const isSaddle = isCritical && classifyCriticalPoint(landscapeHessian(p.x)) === "saddle";

  useEffect(() => {
    if (isSaddle) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [isSaddle]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the point to the landscape&apos;s <strong>saddle point</strong> — where the gradient vanishes but the
          Hessian determinant is negative, so it&apos;s neither a minimum nor a maximum.
        </>
      }
      passed={isSaddle || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <ContourPlayground
        fn={landscape}
        gradient={landscapeGradient}
        domain={DOMAIN}
        value={p}
        onChange={(next) => {
          setHasInteracted(true);
          setP(next);
        }}
        passed={isSaddle}
        readout={`|∇f| = ${gradMag.toFixed(2)}${isCritical ? ` — ${classifyCriticalPoint(landscapeHessian(p.x))}` : ""}`}
      />
    </CheckpointFrame>
  );
}
