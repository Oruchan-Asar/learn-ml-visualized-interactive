"use client";

import { useEffect, useId, useState } from "react";
import { GaussianScene, type GaussianSpec } from "@/components/viz/GaussianScene";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import {
  projectGaussian,
  sortByDepth,
  renderPixel,
  SCENE,
  QUERY_PIXEL,
  CHECKPOINT_TARGET_RED,
  CHECKPOINT_TOLERANCE,
  type ProjectedGaussian,
} from "@/lib/math-core/capstone-3d-gaussian-splatting-renderer";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-3d-gaussian-splatting-renderer";
const DOMAIN: [number, number] = [30, 70];

/** Project every Gaussian in the scene, then hand back farthest-to-nearest — the painter's order that
 * makes GaussianScene's visual stacking match the depth-sorted compositing math. */
function painterOrder(): { projected: ProjectedGaussian; label: string }[] {
  const nearestFirst = sortByDepth(SCENE.map((g) => projectGaussian(g)));
  return [...nearestFirst].reverse().map((p, i, arr) => ({ projected: p, label: i === arr.length - 1 ? "near" : "far" }));
}

function toSpec(p: ProjectedGaussian, label: string): GaussianSpec {
  return { mu: { x: p.x, y: p.y }, sigma: { x: p.sigma2D, y: p.sigma2D }, opacity: p.opacity, color: p.color, label };
}

/** Intuition beat: drag the query pixel across the two projected Gaussians and watch the rendered color blend. No formula shown yet. */
export function IntuitionDemo() {
  const [queryX, setQueryX] = useState(QUERY_PIXEL.x);
  const { color } = renderPixel(queryX, QUERY_PIXEL.y, SCENE);
  const scene = painterOrder().map(({ projected, label }) => toSpec(projected, label));

  return (
    <GaussianScene
      gaussians={scene}
      queryPoint={{ x: queryX, y: QUERY_PIXEL.y }}
      onChangeQueryPoint={(next) => setQueryX(Math.min(DOMAIN[1], Math.max(DOMAIN[0], next.x)))}
      queryColor={color}
      domain={DOMAIN}
      readout="drag the query pixel across the scene — this is a real camera projection (chapter 2) feeding real Gaussian falloff and depth-ordered compositing (chapters 4-5)"
    />
  );
}

/** Play beat: same scene, now with the projection + compositing formulas' live values spelled out. */
export function PlayDemo() {
  const [queryX, setQueryX] = useState(QUERY_PIXEL.x);
  const { color, contributions } = renderPixel(queryX, QUERY_PIXEL.y, SCENE);
  const order = painterOrder();
  const scene = order.map(({ projected, label }) => toSpec(projected, label));
  const nearestFirst = [...order].reverse();

  return (
    <>
      <GaussianScene
        gaussians={scene}
        queryPoint={{ x: queryX, y: QUERY_PIXEL.y }}
        onChangeQueryPoint={(next) => setQueryX(Math.min(DOMAIN[1], Math.max(DOMAIN[0], next.x)))}
        queryColor={color}
        domain={DOMAIN}
        readout={`sigma2D: near=${nearestFirst[0].projected.sigma2D.toFixed(1)}, far=${nearestFirst[1].projected.sigma2D.toFixed(1)} (world spread x f / depth)`}
      />
      <ContributionBars
        items={nearestFirst.map(({ label }, i) => ({ label: `${label} Gaussian`, value: contributions[i] }))}
        max={1}
        readout={`rendered color ≈ (${color.r.toFixed(2)}, ${color.g.toFixed(2)}, ${color.b.toFixed(2)}) — near composited first, far (and background) fill in whatever transmittance remains`}
      />
    </>
  );
}

/** Checkpoint: drag the query pixel between the two projected Gaussians until the rendered red channel hits the target. */
export function CapstoneCheckpoint() {
  const id = useId();
  const [queryX, setQueryX] = useState(QUERY_PIXEL.x);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const { color } = renderPixel(queryX, QUERY_PIXEL.y, SCENE);
  const passed = withinTolerance(color.r, CHECKPOINT_TARGET_RED, CHECKPOINT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const scene = painterOrder().map(({ projected, label }) => toSpec(projected, label));

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the query pixel between the two Gaussians&apos; projected centers until the rendered red
          channel reaches <strong>≈ {CHECKPOINT_TARGET_RED}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the query pixel to try it"
    >
      <GaussianScene
        gaussians={scene}
        queryPoint={{ x: queryX, y: QUERY_PIXEL.y }}
        onChangeQueryPoint={(next) => {
          setHasInteracted(true);
          setQueryX(Math.min(DOMAIN[1], Math.max(DOMAIN[0], next.x)));
        }}
        queryColor={color}
        domain={DOMAIN}
        readout={`rendered red = ${color.r.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <label htmlFor={id} style={{ display: "none" }}>
          query pixel x
        </label>
        <input
          id={id}
          type="range"
          min={DOMAIN[0]}
          max={DOMAIN[1]}
          step={0.1}
          value={queryX}
          onChange={(e) => {
            setHasInteracted(true);
            setQueryX(Number(e.target.value));
          }}
        />
        <span className={styles.stepCount}>query x = {queryX.toFixed(1)}</span>
      </div>
    </CheckpointFrame>
  );
}
