"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ClusterScatter, type ClusterPoint } from "@/components/viz/ClusterScatter";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { POINTS, LABELS, DOMAIN, runAgglomerative, cutDendrogram, clusterCountAtHeight } from "@/lib/math-core/hierarchical-and-agglomerative-clustering";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "hierarchical-and-agglomerative-clustering";

function scatterFromClusters(clusters: number[][]): ClusterPoint[] {
  const group = new Array(POINTS.length).fill(0);
  clusters.forEach((cluster, ci) => cluster.forEach((pointIdx) => (group[pointIdx] = ci)));
  return POINTS.map((p, i) => ({ ...p, group: group[i] }));
}

/** Intuition beat: step through every merge, from 5 singletons down to 1 cluster. */
export function IntuitionDemo() {
  const steps = useMemo(() => runAgglomerative(POINTS), []);
  const [i, setI] = useState(-1); // -1 = before any merges (5 singletons)
  const clusters = i < 0 ? POINTS.map((_, idx) => [idx]) : steps[i].clustersAfter;
  const label = i < 0 ? "Start: every point is its own cluster" : `Merge ${i + 1}/${steps.length}: height ${steps[i].height}`;

  return (
    <>
      <ClusterScatter points={scatterFromClusters(clusters)} domain={DOMAIN} readout={label} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(-1, n - 1))}>
          Previous
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(steps.length - 1, n + 1))}>
          Next
        </button>
      </div>
    </>
  );
}

function HeightSlider({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>cut height = {value.toFixed(1)}</label>
      <input id={id} type="range" min={0} max={4.5} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** Play beat: drag the cut height and watch the dendrogram collapse from 5 clusters down to 1. */
export function PlayDemo() {
  const steps = useMemo(() => runAgglomerative(POINTS), []);
  const [height, setHeight] = useState(0);
  const clusters = cutDendrogram(steps, height);

  return (
    <>
      <ClusterScatter points={scatterFromClusters(clusters)} domain={DOMAIN} readout={`${clusters.length} cluster(s) at height ${height.toFixed(1)}`} />
      <div className={styles.controls}>
        <HeightSlider value={height} onChange={setHeight} />
      </div>
    </>
  );
}

/** Checkpoint: find a cut height that recovers exactly the two true groups. */
export function HierarchicalCheckpoint() {
  const steps = useMemo(() => runAgglomerative(POINTS), []);
  const [height, setHeight] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const count = clusterCountAtHeight(steps, height);
  const passed = count === 2;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag the cut height until the dendrogram splits into exactly <strong>2</strong> clusters — the two true groups, {LABELS.slice(0, 3).join(", ")} and {LABELS.slice(3).join(", ")}.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the cut height to try it"
    >
      <ClusterScatter points={scatterFromClusters(cutDendrogram(steps, height))} domain={DOMAIN} readout={`${count} cluster(s) at height ${height.toFixed(1)}`} />
      <div className={styles.controls}>
        <HeightSlider
          value={height}
          onChange={(h) => {
            setHasInteracted(true);
            setHeight(h);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
