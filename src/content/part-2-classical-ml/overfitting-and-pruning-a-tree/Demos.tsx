"use client";

import { useEffect, useId, useMemo, useState } from "react";
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
  numLeaves,
  costComplexity,
  bestDepthForAlpha,
  bestValidationDepth,
  PRESET_ALPHAS,
} from "@/lib/math-core/overfitting-and-pruning-a-tree";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "overfitting-and-pruning-a-tree";
const TOLERANCE = 0.01;

const BEST_VALIDATION_ACCURACY = Math.max(
  ...Array.from({ length: MAX_TREE_DEPTH }, (_, i) => accuracy(buildTree(TRAIN_POINTS, i + 1), VALIDATION_POINTS)),
);
const BEST_VALIDATION_DEPTH = bestValidationDepth();

function useTreeAtDepth(depth: number) {
  return useMemo(() => {
    const tree = buildTree(TRAIN_POINTS, depth);
    return {
      tree,
      trainAccuracy: accuracy(tree, TRAIN_POINTS),
      validationAccuracy: accuracy(tree, VALIDATION_POINTS),
      leaves: numLeaves(tree),
      regions: treeRegions(tree, TREE_DOMAIN[0], TREE_DOMAIN[1]),
    };
  }, [depth]);
}

function DepthSlider({ value, onChange }: { value: number; onChange: (depth: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>max depth = {value}</label>
      <input
        id={id}
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

function AlphaButtons({ value, onChange }: { value: number; onChange: (alpha: number) => void }) {
  return (
    <div className={styles.buttons}>
      {PRESET_ALPHAS.map((a) => (
        <button
          type="button"
          key={a}
          className={a === value ? styles.buttonActive : styles.button}
          onClick={() => onChange(a)}
        >
          α = {a}
        </button>
      ))}
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

/**
 * Play beat: a depth slider for manual exploration, plus alpha buttons that report which depth
 * cost-complexity pruning would pick on its own — using only the training set, no validation peek.
 */
export function PlayDemo() {
  const [depth, setDepth] = useState(1);
  const [alpha, setAlpha] = useState<number>(PRESET_ALPHAS[0]);
  const { trainAccuracy, validationAccuracy, leaves, regions } = useTreeAtDepth(depth);

  const prunedDepth = bestDepthForAlpha(alpha);
  const prunedTree = buildTree(TRAIN_POINTS, prunedDepth);
  const prunedLeaves = numLeaves(prunedTree);
  const prunedCost = costComplexity(prunedTree, TRAIN_POINTS, alpha);

  return (
    <>
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={regions}
        domain={TREE_DOMAIN}
        readout={
          <>
            Depth {depth} ({leaves} leaves) — train = {(trainAccuracy * 100).toFixed(0)}%, validation ={" "}
            {(validationAccuracy * 100).toFixed(0)}%
            <br />
            At α = {alpha}, cost-complexity pruning picks depth {prunedDepth} ({prunedLeaves} leaves, R_α ={" "}
            {prunedCost.toFixed(2)}) — using only training data.
          </>
        }
      />
      <div className={styles.controls}>
        <DepthSlider value={depth} onChange={setDepth} />
        <AlphaButtons value={alpha} onChange={setAlpha} />
      </div>
    </>
  );
}

/**
 * Checkpoint: pick an alpha large enough that R_alpha's own training-only arithmetic lands on the
 * depth that also happens to be validation-optimal — proof pruning can find the right size blind.
 */
export function PruningCheckpoint() {
  const [alpha, setAlpha] = useState<number>(PRESET_ALPHAS[0]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const prunedDepth = bestDepthForAlpha(alpha);
  const { trainAccuracy, validationAccuracy, leaves, regions } = useTreeAtDepth(prunedDepth);

  const passed = prunedDepth === BEST_VALIDATION_DEPTH && withinTolerance(validationAccuracy, BEST_VALIDATION_ACCURACY, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick an α large enough that cost-complexity pruning — reasoning from training data alone — lands on the
          same depth that reaches the best possible validation accuracy,{" "}
          <strong>{(BEST_VALIDATION_ACCURACY * 100).toFixed(0)}%</strong>. A small α still lets the overgrown tree
          win; you need one where the leaf penalty actually bites.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an α to try it"
    >
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={regions}
        domain={TREE_DOMAIN}
        readout={`α = ${alpha} → depth ${prunedDepth} (${leaves} leaves) — train = ${(trainAccuracy * 100).toFixed(0)}%, validation = ${(validationAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <AlphaButtons
          value={alpha}
          onChange={(a) => {
            setHasInteracted(true);
            setAlpha(a);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
