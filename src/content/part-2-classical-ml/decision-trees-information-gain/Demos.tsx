"use client";

import { useEffect, useState } from "react";
import { SplitPlayground } from "@/components/viz/SplitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { SPLIT_DATA_POINTS, evaluateSplit, bestSplit } from "@/lib/math-core/decision-tree-split";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const DOMAIN: [number, number] = [0, 11];
const CONCEPT_ID = "decision-trees-information-gain";
const BEST_RESULT = bestSplit(SPLIT_DATA_POINTS).result;
const TOLERANCE = 0.03;

/** Intuition beat: drag the split freely, watch information gain respond. */
export function IntuitionDemo() {
  const [threshold, setThreshold] = useState(3);
  const result = evaluateSplit(SPLIT_DATA_POINTS, threshold);
  return (
    <SplitPlayground
      points={SPLIT_DATA_POINTS}
      domain={DOMAIN}
      threshold={threshold}
      onChange={setThreshold}
      readout={`Split at ${threshold.toFixed(1)} — information gain = ${result.informationGain.toFixed(3)} bits`}
    />
  );
}

/** Play beat: same drag, with the full entropy breakdown on both sides visible. */
export function PlayDemo() {
  const [threshold, setThreshold] = useState(3);
  const result = evaluateSplit(SPLIT_DATA_POINTS, threshold);
  return (
    <>
      <SplitPlayground
        points={SPLIT_DATA_POINTS}
        domain={DOMAIN}
        threshold={threshold}
        onChange={setThreshold}
        readout={`H(left, n=${result.leftCount}) = ${result.leftEntropy.toFixed(3)}, H(right, n=${result.rightCount}) = ${result.rightEntropy.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <span>
          Parent H = {result.parentEntropy.toFixed(3)}, weighted child H = {result.weightedEntropy.toFixed(3)}, gain
          = {result.informationGain.toFixed(3)} bits
        </span>
      </div>
    </>
  );
}

/** Checkpoint: find the threshold that (nearly) maximizes information gain. */
export function SplitCheckpoint() {
  const [threshold, setThreshold] = useState(3);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const result = evaluateSplit(SPLIT_DATA_POINTS, threshold);

  const passed = withinTolerance(result.informationGain, BEST_RESULT.informationGain, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the split until information gain reaches within <strong>0.03 bits</strong> of the best possible
          split — {BEST_RESULT.informationGain.toFixed(3)} bits.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the split line to try it"
    >
      <SplitPlayground
        points={SPLIT_DATA_POINTS}
        domain={DOMAIN}
        threshold={threshold}
        onChange={(t) => {
          setHasInteracted(true);
          setThreshold(t);
        }}
        passed={passed}
        readout={`Split at ${threshold.toFixed(1)} — information gain = ${result.informationGain.toFixed(3)} bits`}
      />
    </CheckpointFrame>
  );
}
