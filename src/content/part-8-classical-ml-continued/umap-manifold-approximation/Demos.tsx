"use client";

import { useEffect, useMemo, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  MANIFOLD_POINTS,
  LABELS,
  INIT_LAYOUT,
  LEARNING_RATE,
  kNearestIndices,
  localRadius,
  fuzzyGraph,
  runLayout,
  distance2D,
} from "@/lib/math-core/umap-manifold-approximation";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "umap-manifold-approximation";

// Raw coordinates run 0..2 on both axes — spread them out into GraphPlayground's pixel space.
const SCALE = 80;
const OFFSET_X = 40;
const OFFSET_Y = 180;

function graphNodes(): GraphNodeSpec[] {
  return MANIFOLD_POINTS.map((p, i) => ({
    id: LABELS[i],
    x: p[0] * SCALE + OFFSET_X,
    y: OFFSET_Y - p[1] * SCALE,
    value: localRadius(i, MANIFOLD_POINTS),
    label: LABELS[i],
  }));
}

function knnEdges(k: number): [string, string][] {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  MANIFOLD_POINTS.forEach((_, i) => {
    for (const j of kNearestIndices(i, MANIFOLD_POINTS, k)) {
      const key = [LABELS[i], LABELS[j]].sort().join("::");
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([LABELS[i], LABELS[j]]);
      }
    }
  });
  return edges;
}

/** Intuition beat: toggle k and watch which points count as C's neighbors on the k-NN graph. */
export function IntuitionDemo() {
  const [k, setK] = useState(1);
  const nodes = useMemo(() => graphNodes(), []);
  const edges = knnEdges(k);
  const neighborLabels = kNearestIndices(2, MANIFOLD_POINTS, k).map((i) => LABELS[i]);

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={k === 1 ? styles.buttonActive : styles.button} onClick={() => setK(1)}>
          k=1
        </button>
        <button type="button" className={k === 2 ? styles.buttonActive : styles.button} onClick={() => setK(2)}>
          k=2
        </button>
      </div>
      <GraphPlayground
        nodes={nodes}
        edges={edges}
        focusNodeId="C"
        highlightedNodeIds={neighborLabels}
        readout={`C's neighbor(s) at k=${k}: ${neighborLabels.join(", ")} — the number under each point is its own distance to its nearest neighbor`}
      />
    </>
  );
}

const LAYOUT_SCRIPT = [0, 2, 5, 10, 20];

/** Play beat: step through the force layout and watch connected points pull together while everything else drifts apart. */
export function PlayDemo() {
  const weights = useMemo(() => fuzzyGraph(MANIFOLD_POINTS), []);
  const [i, setI] = useState(0);
  const steps = LAYOUT_SCRIPT[i];
  const positions = runLayout(INIT_LAYOUT, weights, steps, LEARNING_RATE);
  const words = LABELS.map((label, idx) => ({ label, x: positions[idx].x, y: positions[idx].y }));
  const dAB = distance2D(positions[0], positions[1]);
  const dAD = distance2D(positions[0], positions[3]);

  return (
    <>
      <WordEmbeddingSpace
        words={words}
        queryLabel="A"
        nearestLabel="B"
        domain={[-2, 2]}
        readout={`after ${steps} step(s): A↔B = ${dAB.toFixed(2)}, A↔D = ${dAD.toFixed(2)}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(LAYOUT_SCRIPT.length - 1, n + 1))}>
          Next
        </button>
      </div>
    </>
  );
}

const GAP_TARGET = 1.5;

/** Checkpoint: run enough layout steps that A ends up clearly closer to its true neighbor B than to the unconnected D. */
export function UmapCheckpoint() {
  const [steps, setSteps] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const weights = useMemo(() => fuzzyGraph(MANIFOLD_POINTS), []);

  const positions = runLayout(INIT_LAYOUT, weights, steps, LEARNING_RATE);
  const dAB = distance2D(positions[0], positions[1]);
  const dAD = distance2D(positions[0], positions[3]);
  const gap = dAD - dAB;
  const passed = gap > GAP_TARGET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag the steps slider until A is at least <strong>{GAP_TARGET}</strong> units closer to its true neighbor B than to the unconnected D. (Watch out — one lone step can briefly make things worse before they settle.)</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag steps to try it"
    >
      <WordEmbeddingSpace
        words={LABELS.map((label, idx) => ({ label, x: positions[idx].x, y: positions[idx].y }))}
        queryLabel="A"
        nearestLabel="B"
        domain={[-2, 2]}
        readout={`steps=${steps} — A↔B = ${dAB.toFixed(2)}, A↔D = ${dAD.toFixed(2)}, gap = ${gap.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label htmlFor="umap-steps">steps = {steps}</label>
          <input
            id="umap-steps"
            type="range"
            min={0}
            max={20}
            step={1}
            value={steps}
            onChange={(e) => {
              setHasInteracted(true);
              setSteps(Number(e.target.value));
            }}
          />
        </div>
      </div>
    </CheckpointFrame>
  );
}
