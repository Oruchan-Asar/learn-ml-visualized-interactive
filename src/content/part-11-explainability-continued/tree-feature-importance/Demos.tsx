"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { DATA, buildTree, normalizedImportances, splitByThreshold } from "@/lib/math-core/tree-feature-importance";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "tree-feature-importance";
const TREE = buildTree();
const NODES = ["root", "left child", "right child"] as const;

/** Intuition beat: inspect each node's chosen feature and gain, one at a time. */
export function IntuitionDemo() {
  const [nodeIndex, setNodeIndex] = useState(0);
  const split = nodeIndex === 0 ? TREE.rootSplit : nodeIndex === 1 ? TREE.leftSplit : TREE.rightSplit;
  return (
    <>
      <div className={styles.buttons}>
        {NODES.map((n, i) => (
          <button key={n} type="button" className={i === nodeIndex ? styles.buttonActive : styles.button} onClick={() => setNodeIndex(i)}>
            {n}
          </button>
        ))}
      </div>
      {split ? (
        <ContributionBars
          items={[{ label: `${split.feature} @ threshold ${split.threshold}`, value: split.gain }]}
          formatValue={(v) => v.toFixed(4)}
          readout={`n=${split.nSamples} samples reach this node`}
        />
      ) : (
        <p>No split needed — this node is already pure.</p>
      )}
    </>
  );
}

/** Play beat: the final tally — every node's weighted gain, summed per feature. */
export function PlayDemo() {
  const norm = normalizedImportances(TREE);
  return (
    <ContributionBars
      items={[
        { label: "x1 importance", value: norm.x1 },
        { label: "x2 importance", value: norm.x2 },
      ]}
      formatValue={(v) => v.toFixed(3)}
      readout={`x1: used at the root (8/8 samples). x2: used only at the left child (4/8 samples), where it catches the one point x1 got wrong`}
    />
  );
}

/** Checkpoint: find which of the 8 points is the one x2 exists to catch. */
export function TreeImportanceCheckpoint() {
  const [pointIndex, setPointIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const { left } = splitByThreshold(DATA, TREE.rootSplit.feature, TREE.rootSplit.threshold);
  const candidateIndices = [0, 2, 3]; // three of the four left-child points
  const passed = pointIndex === 2; // the mislabeled point, index 2 in DATA

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the one point, among these three, whose label <strong>doesn&apos;t match</strong> what x1 alone would predict.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a point to try it"
    >
      <div className={styles.buttons}>
        {candidateIndices.map((i) => (
          <button
            key={i}
            type="button"
            className={i === pointIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setPointIndex(i);
            }}
          >
            x1={DATA[i].x1}, x2={DATA[i].x2}
          </button>
        ))}
      </div>
      {pointIndex !== null && (
        <ContributionBars items={[{ label: `point (x1=${DATA[pointIndex].x1})`, value: DATA[pointIndex].label === "A" ? 1 : -1 }]} formatValue={() => DATA[pointIndex].label} readout={`left child has ${left.length} points; x1 alone predicts "A" for all of them`} />
      )}
    </CheckpointFrame>
  );
}
