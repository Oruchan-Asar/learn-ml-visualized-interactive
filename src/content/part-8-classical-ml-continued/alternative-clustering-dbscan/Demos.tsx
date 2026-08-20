"use client";

import { useEffect, useId, useState } from "react";
import { ClusterScatter } from "@/components/viz/ClusterScatter";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { DATA, DOMAIN, MIN_NEIGHBORS, runDBSCAN, NOISE } from "@/lib/math-core/alternative-clustering-dbscan";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "alternative-clustering-dbscan";

function scatterPoints(eps: number) {
  const labels = runDBSCAN(DATA, eps, MIN_NEIGHBORS);
  return DATA.map((p, i) => ({ ...p, group: labels[i] }));
}

function clusterCount(eps: number): number {
  const labels = runDBSCAN(DATA, eps, MIN_NEIGHBORS);
  return new Set(labels.filter((l) => l !== NOISE)).size;
}

function EpsSlider({ value, onChange }: { value: number; onChange: (eps: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>eps = {value.toFixed(1)}</label>
      <input id={id} type="range" min={0.5} max={6} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** Intuition beat: drag eps and watch DBSCAN's cluster count and noise assignment change live. */
export function IntuitionDemo() {
  const [eps, setEps] = useState(1.5);
  const noiseCount = runDBSCAN(DATA, eps, MIN_NEIGHBORS).filter((l) => l === NOISE).length;
  return (
    <>
      <ClusterScatter points={scatterPoints(eps)} domain={DOMAIN} readout={`${clusterCount(eps)} cluster(s), ${noiseCount} noise point(s)`} />
      <div className={styles.controls}>
        <EpsSlider value={eps} onChange={setEps} />
      </div>
    </>
  );
}

/** Play beat: compare a too-small, a just-right, and a too-large eps side by side. */
export function PlayDemo() {
  const [eps, setEps] = useState(0.5);
  const noiseCount = runDBSCAN(DATA, eps, MIN_NEIGHBORS).filter((l) => l === NOISE).length;
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={eps === 0.5 ? styles.buttonActive : styles.button} onClick={() => setEps(0.5)}>
          Too small (0.5)
        </button>
        <button type="button" className={eps === 1.5 ? styles.buttonActive : styles.button} onClick={() => setEps(1.5)}>
          Just right (1.5)
        </button>
        <button type="button" className={eps === 5 ? styles.buttonActive : styles.button} onClick={() => setEps(5)}>
          Too large (5.0)
        </button>
      </div>
      <ClusterScatter points={scatterPoints(eps)} domain={DOMAIN} readout={`${clusterCount(eps)} cluster(s), ${noiseCount} noise point(s)`} />
    </>
  );
}

/** Checkpoint: find an eps that merges the two true clusters into one, without ever touching the noise point. */
export function DbscanCheckpoint() {
  const [eps, setEps] = useState(1.5);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const labels = runDBSCAN(DATA, eps, MIN_NEIGHBORS);
  const passed = clusterCount(eps) === 1 && labels[7] === NOISE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find an <strong>eps</strong> that merges the two chains into a single cluster — without ever absorbing the far-off noise point.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag eps to try it"
    >
      <ClusterScatter points={scatterPoints(eps)} domain={DOMAIN} readout={`${clusterCount(eps)} cluster(s)`} />
      <div className={styles.controls}>
        <EpsSlider
          value={eps}
          onChange={(v) => {
            setHasInteracted(true);
            setEps(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
