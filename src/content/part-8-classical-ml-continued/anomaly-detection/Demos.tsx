"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { DATA, isolationDepths, anomalyScore } from "@/lib/math-core/anomaly-detection";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "anomaly-detection";
const DEPTHS = isolationDepths();

function scoreBars() {
  return DATA.map((v) => ({ label: `point ${v}`, value: anomalyScore(v) }));
}

function depthBars() {
  return DATA.map((v) => ({ label: `point ${v}`, value: DEPTHS[v] }));
}

/** Intuition beat: every point's anomaly score, derived from how few splits it took to isolate. */
export function IntuitionDemo() {
  return <ContributionBars items={scoreBars()} readout="higher = more anomalous (isolated in fewer splits)" />;
}

/** Play beat: the raw isolation depths themselves — the outlier stands out immediately. */
export function PlayDemo() {
  return <ContributionBars items={depthBars()} readout="bar length = number of splits to isolate — the shortest bar is the anomaly" />;
}

/** Checkpoint: click the point you think is the anomaly, verified against the shortest isolation path. */
export function AnomalyCheckpoint() {
  const [guess, setGuess] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const mostAnomalous = DATA.reduce((best, v) => (anomalyScore(v) > anomalyScore(best) ? v : best));
  const passed = guess === mostAnomalous;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Click the point that isolates in the <strong>fewest</strong> splits — the anomaly.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a point to try it"
    >
      <div className={styles.buttons}>
        {DATA.map((v) => (
          <button
            type="button"
            key={v}
            className={guess === v ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setGuess(v);
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <ContributionBars items={scoreBars()} readout={guess !== null ? `point ${guess}: score ${anomalyScore(guess).toFixed(2)}, depth ${DEPTHS[guess]}` : "click a point"} />
    </CheckpointFrame>
  );
}
