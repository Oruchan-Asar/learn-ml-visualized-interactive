"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { TreeFitPlayground } from "@/components/viz/TreeFitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TRAIN_POINTS, VALIDATION_POINTS, TREE_DOMAIN } from "@/lib/math-core/overfitting-tree";
import { FOREST_TREES, MAX_TREES, ensembleAccuracy, forestRegions } from "@/lib/math-core/bagging";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "ensembles-bagging-and-random-forests";
const TOLERANCE = 0.01;
const BEST_VALIDATION_ACCURACY = ensembleAccuracy(FOREST_TREES, VALIDATION_POINTS);

function useForestAtSize(nTrees: number) {
  return useMemo(() => {
    const trees = FOREST_TREES.slice(0, nTrees);
    return {
      trainAccuracy: ensembleAccuracy(trees, TRAIN_POINTS),
      validationAccuracy: ensembleAccuracy(trees, VALIDATION_POINTS),
      regions: forestRegions(trees, TREE_DOMAIN[0], TREE_DOMAIN[1]),
    };
  }, [nTrees]);
}

function TreeCountSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>trees in forest = {value}</label>
      <input
        id={id}
        type="range"
        min={1}
        max={MAX_TREES}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: add trees one at a time, watch the jagged single-tree regions smooth into the true boundary. */
export function IntuitionDemo() {
  const [nTrees, setNTrees] = useState(1);
  const { validationAccuracy, regions } = useForestAtSize(nTrees);
  return (
    <>
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={regions}
        domain={TREE_DOMAIN}
        readout={`${nTrees} tree${nTrees === 1 ? "" : "s"} — validation accuracy = ${(validationAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <TreeCountSlider value={nTrees} onChange={setNTrees} />
      </div>
    </>
  );
}

/** Play beat: both train and validation accuracy visible, so the gap from Chapter 8 can be watched closing. */
export function PlayDemo() {
  const [nTrees, setNTrees] = useState(1);
  const { trainAccuracy, validationAccuracy, regions } = useForestAtSize(nTrees);
  return (
    <>
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={regions}
        domain={TREE_DOMAIN}
        readout={`${nTrees} tree${nTrees === 1 ? "" : "s"} — train = ${(trainAccuracy * 100).toFixed(0)}%, validation = ${(validationAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <TreeCountSlider value={nTrees} onChange={setNTrees} />
      </div>
    </>
  );
}

/** Checkpoint: grow the forest until validation accuracy reaches the ensemble's best. */
export function BaggingCheckpoint() {
  const [nTrees, setNTrees] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const { trainAccuracy, validationAccuracy, regions } = useForestAtSize(nTrees);

  const passed = withinTolerance(validationAccuracy, BEST_VALIDATION_ACCURACY, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Grow the forest until validation accuracy reaches its best —{" "}
          <strong>{(BEST_VALIDATION_ACCURACY * 100).toFixed(0)}%</strong>. One tree alone won&rsquo;t get there.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the tree-count slider to try it"
    >
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={regions}
        domain={TREE_DOMAIN}
        readout={`${nTrees} tree${nTrees === 1 ? "" : "s"} — train = ${(trainAccuracy * 100).toFixed(0)}%, validation = ${(validationAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <TreeCountSlider
          value={nTrees}
          onChange={(n) => {
            setHasInteracted(true);
            setNTrees(n);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
