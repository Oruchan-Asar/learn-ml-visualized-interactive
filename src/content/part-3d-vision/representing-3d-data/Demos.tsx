"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import {
  CUBE_VERTEX_COUNT,
  CUBE_TRIANGLE_COUNT,
  CUBE_SIDE_LENGTH,
  CHECKPOINT_VOXEL_RESOLUTION,
  meshBytes,
  voxelQuantizationError,
  summarizeRepresentations,
} from "@/lib/math-core/representing-3d-data";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "representing-3d-data";

function ResolutionSlider({ resolution, onChange }: { resolution: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.controls}>
      <div className={styles.sliderRow}>
        <label htmlFor={id}>voxel resolution: {resolution}³</label>
        <input
          id={id}
          type="range"
          min={2}
          max={16}
          step={1}
          value={resolution}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

/** Intuition beat: the same unit cube, three ways — watch the voxel grid's cost balloon as resolution climbs. */
export function IntuitionDemo() {
  const [resolution, setResolution] = useState(4);
  const items = summarizeRepresentations(resolution).map((r) => ({ label: r.label, value: r.bytes }));

  return (
    <>
      <ContributionBars
        items={items}
        formatValue={(v) => `${v} B`}
        readout={`Point cloud and mesh cost stay fixed — 8 exact vertices either way. The voxel grid's cost is entirely a choice of resolution.`}
      />
      <ResolutionSlider resolution={resolution} onChange={setResolution} />
    </>
  );
}

/** Play beat: same three bars, now with the live quantization-error tradeoff spelled out. */
export function PlayDemo() {
  const [resolution, setResolution] = useState(4);
  const items = summarizeRepresentations(resolution).map((r) => ({ label: r.label, value: r.bytes }));
  const error = voxelQuantizationError(CUBE_SIDE_LENGTH, resolution);
  const voxelBytes = items[1].value;
  const crossedMesh = voxelBytes > meshBytes(CUBE_VERTEX_COUNT, CUBE_TRIANGLE_COUNT);

  return (
    <>
      <ContributionBars
        items={items}
        formatValue={(v) => `${v} B`}
        readout={`worst-case positional error = side/resolution/2 = 1/${resolution}/2 = ${error.toFixed(4)}${crossedMesh ? "  (voxel grid already costs more than the exact mesh!)" : ""}`}
      />
      <ResolutionSlider resolution={resolution} onChange={setResolution} />
    </>
  );
}

/** Checkpoint: drag resolution until the voxel grid's worst-case error drops to the target. */
export function RepresentingCheckpoint() {
  const [resolution, setResolution] = useState(2);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const error = voxelQuantizationError(CUBE_SIDE_LENGTH, resolution);
  const target = voxelQuantizationError(CUBE_SIDE_LENGTH, CHECKPOINT_VOXEL_RESOLUTION);
  const passed = withinTolerance(error, target, 0.004);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const items = summarizeRepresentations(resolution).map((r) => ({ label: r.label, value: r.bytes }));

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the resolution slider until the voxel grid&apos;s worst-case positional error drops to{" "}
          <strong>≈ {target.toFixed(4)}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the resolution slider to try it"
    >
      <ContributionBars items={items} formatValue={(v) => `${v} B`} readout={`error = ${error.toFixed(4)}`} />
      <ResolutionSlider
        resolution={resolution}
        onChange={(v) => {
          setHasInteracted(true);
          setResolution(v);
        }}
      />
    </CheckpointFrame>
  );
}
