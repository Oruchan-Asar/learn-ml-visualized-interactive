"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { ClusterScatter } from "@/components/viz/ClusterScatter";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import {
  worldToCamera,
  perspectiveDivide,
  applyIntrinsics,
  ORIGIN_CAMERA,
  DEFAULT_INTRINSICS,
  CHECKPOINT_TARGET_V,
  CHECKPOINT_TOLERANCE_V,
} from "@/lib/math-core/camera-projections-and-coordinate-systems";

const CONCEPT_ID = "camera-projections-and-coordinate-systems";
const MIN_Z = 0.5;

/** A side view (world Z across, world Y up) with X pinned at 0, so only v (vertical pixel) moves. */
function projectSideView(z: number, y: number) {
  const cam = worldToCamera({ x: 0, y, z: Math.max(MIN_Z, z) }, ORIGIN_CAMERA);
  const ndc = perspectiveDivide(cam);
  return applyIntrinsics(ndc, DEFAULT_INTRINSICS);
}

/** Intuition beat: drag the world point in a Z (depth) / Y (height) side view, watch where it lands on the image plane. No formula shown yet. */
export function IntuitionDemo() {
  const [world, setWorld] = useState({ x: 5, y: 2 });
  const { x: u, y: v } = projectSideView(world.x, world.y);

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <VectorPlayground
        vectors={[{ x: world.x, y: world.y, draggable: true }]}
        onChangeVector={(_, next) => setWorld({ x: Math.max(MIN_Z, next.x), y: next.y })}
        domain={[-2, 10]}
        readout={`world: Z = ${world.x.toFixed(1)}, Y = ${world.y.toFixed(1)}  (X = 0)`}
      />
      <ClusterScatter
        points={[{ x: u, y: v, group: 0 }]}
        domain={[0, 100]}
        readout={`image plane: (u, v) = (${u.toFixed(0)}, ${v.toFixed(0)})`}
      />
    </div>
  );
}

/** Play beat: same side view, but the live formula values are shown alongside the drag. */
export function PlayDemo() {
  const [world, setWorld] = useState({ x: 5, y: -2 });
  const zClamped = Math.max(MIN_Z, world.x);
  const yOverZ = world.y / zClamped;
  const { x: u, y: v } = projectSideView(world.x, world.y);

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <VectorPlayground
        vectors={[{ x: world.x, y: world.y, draggable: true }]}
        onChangeVector={(_, next) => setWorld({ x: Math.max(MIN_Z, next.x), y: next.y })}
        domain={[-2, 10]}
        readout={`Y/Z = ${world.y.toFixed(1)} / ${zClamped.toFixed(1)} = ${yOverZ.toFixed(2)}`}
      />
      <ClusterScatter
        points={[{ x: u, y: v, group: 0 }]}
        domain={[0, 100]}
        readout={`v = f·(Y/Z) + cy = 100 × ${yOverZ.toFixed(2)} + 50 = ${v.toFixed(1)}`}
      />
    </div>
  );
}

export function CameraProjectionCheckpoint() {
  const [world, setWorld] = useState({ x: 5, y: -3 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const { y: v } = projectSideView(world.x, world.y);
  const passed = withinTolerance(v, CHECKPOINT_TARGET_V, CHECKPOINT_TOLERANCE_V);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the world point until its projected image coordinate reads <strong>v ≈ {CHECKPOINT_TARGET_V}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the world point to try it"
    >
      <VectorPlayground
        vectors={[{ x: world.x, y: world.y, draggable: true }]}
        onChangeVector={(_, next) => {
          setHasInteracted(true);
          setWorld({ x: Math.max(MIN_Z, next.x), y: next.y });
        }}
        domain={[-2, 10]}
        passed={passed}
        readout={`v = ${v.toFixed(1)}`}
      />
    </CheckpointFrame>
  );
}
