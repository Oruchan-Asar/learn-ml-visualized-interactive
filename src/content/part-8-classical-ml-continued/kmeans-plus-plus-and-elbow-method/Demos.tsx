"use client";

import { useEffect, useMemo, useState } from "react";
import { ClusterPlayground } from "@/components/viz/ClusterPlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  POINTS,
  DOMAIN,
  RANDOM_DRAWS,
  type Point2D,
  nearestSquaredDistances,
  pickNextCentroidIndex,
  assignClusters,
  kmeansPlusPlusInit,
  lloydConverge,
  elbowCurve,
  findElbowK,
} from "@/lib/math-core/kmeans-plus-plus-and-elbow-method";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "kmeans-plus-plus-and-elbow-method";
const LABELS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];
const KS = [1, 2, 3, 4];

interface SeedStep {
  centroids: Point2D[];
}

/** The sequential k-means++ seeding process for k=3: after each draw, one more centroid is locked in. */
function seedScript(): SeedStep[] {
  const script: SeedStep[] = [{ centroids: [POINTS[0]] }];
  let centroids: Point2D[] = [POINTS[0]];
  for (let i = 1; i < 3; i++) {
    const idx = pickNextCentroidIndex(POINTS, centroids, RANDOM_DRAWS[i - 1]);
    centroids = [...centroids, POINTS[idx]];
    script.push({ centroids });
  }
  return script;
}

/** Intuition beat: step through k-means++ seeding — farther-away points get taller D(x)^2 bars, and taller bars get picked more often. */
export function IntuitionDemo() {
  const script = useMemo(() => seedScript(), []);
  const [i, setI] = useState(0);
  const current = script[i];
  const weights = nearestSquaredDistances(POINTS, current.centroids);
  const assignments = assignClusters(POINTS, current.centroids);

  return (
    <>
      <ClusterPlayground
        points={POINTS}
        centroids={current.centroids}
        assignments={assignments}
        domain={DOMAIN}
        readout={`${current.centroids.length} centroid(s) chosen so far`}
      />
      <ContributionBars
        items={LABELS.map((label, idx) => ({ label, value: weights[idx] }))}
        readout="taller bar = farther from every centroid chosen so far = more likely to be picked next"
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(script.length - 1, n + 1))}>
          Next
        </button>
      </div>
    </>
  );
}

function clusteringFor(k: number) {
  const seed = kmeansPlusPlusInit(POINTS, k);
  return lloydConverge(POINTS, seed);
}

/** Play beat: try every k and watch both the resulting clusters and the elbow curve respond. */
export function PlayDemo() {
  const [k, setK] = useState(1);
  const { assignments, centroids } = clusteringFor(k);
  const curve = elbowCurve(POINTS, KS);

  return (
    <>
      <div className={styles.buttons}>
        {KS.map((candidate) => (
          <button key={candidate} type="button" className={k === candidate ? styles.buttonActive : styles.button} onClick={() => setK(candidate)}>
            k={candidate}
          </button>
        ))}
      </div>
      <ClusterPlayground points={POINTS} centroids={centroids} assignments={assignments} domain={DOMAIN} readout={`inertia at k=${k}: ${curve[k - 1].toFixed(2)}`} />
      <ContributionBars items={KS.map((candidate, idx) => ({ label: `k=${candidate}`, value: curve[idx] }))} readout="inertia by k — look for where the drop suddenly shrinks" />
    </>
  );
}

/** Checkpoint: pick the k the elbow method itself would choose. */
export function KmeansElbowCheckpoint() {
  const [k, setK] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const curve = elbowCurve(POINTS, KS);
  const elbowK = findElbowK(curve, KS);
  const passed = k === elbowK;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const { assignments, centroids } = clusteringFor(k);

  return (
    <CheckpointFrame
      instructions={<>Pick the value of <strong>k</strong> where the inertia drop collapses — the elbow of the curve.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a k to try it"
    >
      <div className={styles.buttons}>
        {KS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className={k === candidate ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setK(candidate);
            }}
          >
            k={candidate}
          </button>
        ))}
      </div>
      <ClusterPlayground points={POINTS} centroids={centroids} assignments={assignments} domain={DOMAIN} readout={`inertia at k=${k}: ${curve[k - 1].toFixed(2)}`} />
    </CheckpointFrame>
  );
}
