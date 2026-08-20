"use client";

import { useEffect, useState } from "react";
import { ClusterPlayground } from "@/components/viz/ClusterPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { CLUSTER_POINTS, CLUSTER_DOMAIN, INITIAL_CENTROIDS, assignClusters, kMeansStep } from "@/lib/math-core/kmeans";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "k-means-clustering";
const TOLERANCE = 0.1;
const TRUE_CENTROIDS = [
  { x: 26 / 3, y: 91 / 12 },
  { x: 5 / 3, y: 19 / 12 },
];

function useKMeans(initialCentroids: typeof INITIAL_CENTROIDS) {
  const [centroids, setCentroids] = useState(initialCentroids);
  const [stepCount, setStepCount] = useState(0);
  const assignments = assignClusters(CLUSTER_POINTS, centroids);

  const step = () => {
    setCentroids((current) => kMeansStep(CLUSTER_POINTS, current).centroids);
    setStepCount((n) => n + 1);
  };
  const reset = () => {
    setCentroids(initialCentroids);
    setStepCount(0);
  };
  const moveCentroid = (index: number, next: { x: number; y: number }) => {
    setCentroids((current) => current.map((c, i) => (i === index ? next : c)));
    setStepCount(0);
  };

  return { centroids, assignments, stepCount, step, reset, moveCentroid };
}

function StepResetButtons({ onStep, onReset }: { onStep: () => void; onReset: () => void }) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={styles.buttonPrimary} onClick={onStep}>
        Take a step
      </button>
      <button type="button" className={styles.button} onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

/** Intuition beat: drag the centroids anywhere, then step — watch them wander toward the two blobs. */
export function IntuitionDemo() {
  const { centroids, assignments, stepCount, step, reset, moveCentroid } = useKMeans(INITIAL_CENTROIDS);
  return (
    <>
      <ClusterPlayground
        points={CLUSTER_POINTS}
        centroids={centroids}
        assignments={assignments}
        onChangeCentroid={moveCentroid}
        domain={CLUSTER_DOMAIN}
        readout={`Step ${stepCount} — drag a centroid, or take a step`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: same controls — try starting from a few different centroid positions and see how the step count changes. */
export function PlayDemo() {
  const { centroids, assignments, stepCount, step, reset, moveCentroid } = useKMeans(INITIAL_CENTROIDS);
  return (
    <>
      <ClusterPlayground
        points={CLUSTER_POINTS}
        centroids={centroids}
        assignments={assignments}
        onChangeCentroid={moveCentroid}
        domain={CLUSTER_DOMAIN}
        readout={`Step ${stepCount} — centroid 1: (${centroids[0].x.toFixed(2)}, ${centroids[0].y.toFixed(2)}), centroid 2: (${centroids[1].x.toFixed(2)}, ${centroids[1].y.toFixed(2)})`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: from a fixed bad start, step until both centroids settle on their true cluster means. */
export function KMeansCheckpoint() {
  const { centroids, assignments, stepCount, step, reset } = useKMeans(INITIAL_CENTROIDS);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed =
    withinDistance(centroids[0], TRUE_CENTROIDS[0], TOLERANCE) &&
    withinDistance(centroids[1], TRUE_CENTROIDS[1], TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Starting from this deliberately bad position, take steps until both centroids converge.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Take a step to try it"
    >
      <ClusterPlayground
        points={CLUSTER_POINTS}
        centroids={centroids}
        assignments={assignments}
        domain={CLUSTER_DOMAIN}
        readout={`Step ${stepCount} — centroid 1: (${centroids[0].x.toFixed(2)}, ${centroids[0].y.toFixed(2)}), centroid 2: (${centroids[1].x.toFixed(2)}, ${centroids[1].y.toFixed(2)})`}
      />
      <div className={styles.controls}>
        <StepResetButtons
          onStep={() => {
            setHasInteracted(true);
            step();
          }}
          onReset={reset}
        />
      </div>
    </CheckpointFrame>
  );
}
