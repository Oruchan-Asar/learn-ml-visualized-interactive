"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import {
  vertexSlot,
  bilinearInterpolate,
  COARSE_LEVEL,
  FINE_LEVEL,
  QUERY_POINT,
  CHECKPOINT_TARGET_VALUE,
  CHECKPOINT_TOLERANCE,
  type GridLevel,
} from "@/lib/math-core/instant-ngp-and-hash-encoding";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "instant-ngp-and-hash-encoding";

// A fixed hue per slot number, so "same slot" reads as "same color" at a glance — the visual tell for a
// hash collision (two different grid vertices painted the same color).
const SLOT_HUES = [4, 30, 90, 150, 200, 230, 270, 320];

function slotChipStyle(slot: number, ringed: boolean) {
  const hue = SLOT_HUES[slot % SLOT_HUES.length];
  return {
    width: 34,
    height: 34,
    borderRadius: 6,
    background: `hsl(${hue}, 55%, 80%)`,
    border: ringed ? "3px solid var(--ink)" : "1px solid var(--line)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "#1a1a1a",
    fontWeight: 600,
  } as const;
}

/** Every vertex of a level's grid, laid out row by row (iy=resolution-1 at top), colored by which hash
 * table slot it lands in. Two same-colored cells = two vertices sharing one slot = a collision. */
function GridView({ level, activeCorners, label }: { level: GridLevel; activeCorners?: { ix: number; iy: number }[]; label: string }) {
  const rows = [];
  for (let iy = level.resolution - 1; iy >= 0; iy--) {
    const cells = [];
    for (let ix = 0; ix < level.resolution; ix++) {
      const slot = vertexSlot(ix, iy, level);
      const isActive = activeCorners?.some((c) => c.ix === ix && c.iy === iy) ?? false;
      cells.push(
        <div key={ix} style={slotChipStyle(slot, isActive)} title={`vertex (${ix},${iy}) -> slot ${slot}`}>
          {slot}
        </div>,
      );
    }
    rows.push(
      <div key={iy} style={{ display: "flex", gap: 4 }}>
        {cells}
      </div>,
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-soft)" }}>
        {label} — resolution {level.resolution}², table size {level.tableSize}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{rows}</div>
    </div>
  );
}

/** Intuition beat: the fine level's 16 vertices squeezed into an 8-slot table — three of them (highlighted) collide into slot 6. */
export function IntuitionDemo() {
  const collidingVertices = [
    { ix: 1, iy: 1 },
    { ix: 0, iy: 2 },
    { ix: 3, iy: 3 },
  ];
  return (
    <>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        <GridView level={COARSE_LEVEL} label="coarse: dense, 1 slot per vertex" />
        <GridView level={FINE_LEVEL} label="fine: hashed, slots reused" activeCorners={collidingVertices} />
      </div>
      <div className={styles.controls}>
        <span className={styles.stepCount}>
          Same-colored chips = same hash slot. The three ringed vertices on the fine grid all hash to slot 6
          — they share one learned feature whether they &quot;want&quot; to or not.
        </span>
      </div>
    </>
  );
}

function corners(qx: number, qy: number, level: GridLevel) {
  return bilinearInterpolate(qx, qy, level).corners.map((c) => ({ ix: c.ix, iy: c.iy }));
}

/** Play beat: drag the query point and watch which 4 vertices (the bilinear stencil) light up, and how much weight each contributes. */
export function PlayDemo() {
  const [qx, setQx] = useState(QUERY_POINT.x);
  const [qy, setQy] = useState(QUERY_POINT.y);
  const fine = bilinearInterpolate(qx, qy, FINE_LEVEL);
  const coarse = bilinearInterpolate(qx, qy, COARSE_LEVEL);
  const items = fine.corners.map((c) => ({ label: `(${c.ix},${c.iy}) val=${c.value}`, value: c.weight }));

  return (
    <>
      <GridView level={FINE_LEVEL} label="fine level — active bilinear stencil" activeCorners={corners(qx, qy, FINE_LEVEL)} />
      <ContributionBars items={items} max={1} formatValue={(v) => v.toFixed(2)} readout={`fine-level encoding ≈ ${fine.value.toFixed(2)}  |  coarse-level encoding ≈ ${coarse.value.toFixed(2)}`} />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label>query x: {qx.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.01} value={qx} onChange={(e) => setQx(Number(e.target.value))} />
        </div>
        <div className={styles.sliderRow}>
          <label>query y: {qy.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.01} value={qy} onChange={(e) => setQy(Number(e.target.value))} />
        </div>
      </div>
    </>
  );
}

/** Checkpoint: drag the query point until it lands exactly on the fine level's vertex (1,3), whose feature is 50. */
export function InstantNgpCheckpoint() {
  const id = useId();
  const [qx, setQx] = useState(0.5);
  const [qy, setQy] = useState(0.5);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const { value, corners: activeCorners } = bilinearInterpolate(qx, qy, FINE_LEVEL);
  const passed = withinTolerance(value, CHECKPOINT_TARGET_VALUE, CHECKPOINT_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the query point until the fine level&apos;s interpolated feature reaches{" "}
          <strong>≈ {CHECKPOINT_TARGET_VALUE}</strong> (hint: land close to a single vertex — set y to 1
          and x near 1/3).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the sliders to try it"
    >
      <GridView level={FINE_LEVEL} label="fine level" activeCorners={activeCorners.map((c) => ({ ix: c.ix, iy: c.iy }))} />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label htmlFor={`${id}-x`}>query x: {qx.toFixed(2)}</label>
          <input
            id={`${id}-x`}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={qx}
            onChange={(e) => {
              setHasInteracted(true);
              setQx(Number(e.target.value));
            }}
          />
        </div>
        <div className={styles.sliderRow}>
          <label htmlFor={`${id}-y`}>query y: {qy.toFixed(2)}</label>
          <input
            id={`${id}-y`}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={qy}
            onChange={(e) => {
              setHasInteracted(true);
              setQy(Number(e.target.value));
            }}
          />
        </div>
      </div>
      <div className={styles.controls}>
        <span className={styles.stepCount}>interpolated value = {value.toFixed(2)}</span>
      </div>
    </CheckpointFrame>
  );
}
