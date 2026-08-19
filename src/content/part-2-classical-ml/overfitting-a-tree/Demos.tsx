"use client";

import { useEffect, useMemo, useState } from "react";
import { TreeFitPlayground } from "@/components/viz/TreeFitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TRAIN_POINTS,
  VALIDATION_POINTS,
  MAX_TREE_DEPTH,
  TREE_DOMAIN,
  buildTree,
  accuracy,
  treeRegions,
} from "@/lib/math-core/overfitting-tree";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "overfitting-a-tree";
const TOLERANCE = 0.01;

const BEST_VALIDATION_ACCURACY = Math.max(
  ...Array.from({ length: MAX_TREE_DEPTH }, (_, i) => accuracy(buildTree(TRAIN_POINTS, i + 1), VALIDATION_POINTS)),
);

function useTreeAtDepth(depth: number) {
  return useMemo(() => {
    const tree = buildTree(TRAIN_POINTS, depth);
    return {
      tree,
      trainAccuracy: accuracy(tree, TRAIN_POINTS),
      validationAccuracy: accuracy(tree, VALIDATION_POINTS),
      regions: treeRegions(tree, TREE_DOMAIN[0], TREE_DOMAIN[1]),
    };
  }, [depth]);
}

function DepthSlider({ value, onChange }: { value: number; onChange: (depth: number) => void }) {
  return (
    <div className={styles.sliderRow}>
      <label htmlFor="depth-slider">max depth = {value}</label>
      <input
        id="depth-slider"
        type="range"
        min={1}
        max={MAX_TREE_DEPTH}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: grow the tree deeper, watch it carve out smaller and smaller regions. */
export function IntuitionDemo() {
  const [depth, setDepth] = useState(1);
  const { trainAccuracy, regions } = useTreeAtDepth(depth);
  return (
    <>
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={regions}
        domain={TREE_DOMAIN}
        readout={`Depth ${depth} — train accuracy = ${(trainAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <DepthSlider value={depth} onChange={setDepth} />
      </div>
    </>
  );
}

/** Play beat: same control, but both train and validation accuracy are visible side by side. */
export function PlayDemo() {
  const [depth, setDepth] = useState(1);
  const { trainAccuracy, validationAccuracy, regions } = useTreeAtDepth(depth);
  return (
    <>
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={regions}
        domain={TREE_DOMAIN}
        readout={`Depth ${depth} — train = ${(trainAccuracy * 100).toFixed(0)}%, validation = ${(validationAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <DepthSlider value={depth} onChange={setDepth} />
      </div>
    </>
  );
}

/** Checkpoint: find a depth that reaches the best possible validation accuracy — deeper isn't automatically better. */
export function OverfitCheckpoint() {
  const [depth, setDepth] = useState(MAX_TREE_DEPTH);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const { trainAccuracy, validationAccuracy, regions } = useTreeAtDepth(depth);

  const passed = withinTolerance(validationAccuracy, BEST_VALIDATION_ACCURACY, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          This tree starts at max depth, fully overfit. Prune it back to reach the best possible validation
          accuracy — <strong>{(BEST_VALIDATION_ACCURACY * 100).toFixed(0)}%</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the depth slider to try it"
    >
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={regions}
        domain={TREE_DOMAIN}
        readout={`Depth ${depth} — train = ${(trainAccuracy * 100).toFixed(0)}%, validation = ${(validationAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <DepthSlider
          value={depth}
          onChange={(d) => {
            setHasInteracted(true);
            setDepth(d);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
