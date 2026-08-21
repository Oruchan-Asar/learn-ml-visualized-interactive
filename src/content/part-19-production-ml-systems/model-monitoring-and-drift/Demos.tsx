"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  BIN_LABELS,
  TRAIN_DIST,
  LIVE_DIST,
  weightedAccuracy,
  driftScore,
  DRIFT_ALERT_THRESHOLD,
  isDrifting,
  CANDIDATES,
} from "@/lib/math-core/model-monitoring-and-drift";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import monStyles from "./Monitor.module.css";

const CONCEPT_ID = "model-monitoring-and-drift";

function toBars(dist: number[]) {
  return dist.map((v, i) => ({ label: BIN_LABELS[i], value: v }));
}

/** Intuition beat: switch between the training-time snapshot and a live snapshot, watching the bin distribution reshape while accuracy holds still. */
export function IntuitionDemo() {
  const [snapshot, setSnapshot] = useState<"train" | "live">("train");
  const dist = snapshot === "train" ? TRAIN_DIST : LIVE_DIST;
  const drift = driftScore(TRAIN_DIST, dist);

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={snapshot === "train" ? styles.buttonActive : styles.button} onClick={() => setSnapshot("train")}>
          training snapshot
        </button>
        <button type="button" className={snapshot === "live" ? styles.buttonActive : styles.button} onClick={() => setSnapshot("live")}>
          live snapshot
        </button>
      </div>
      <ContributionBars items={toBars(dist)} formatValue={(v) => v.toFixed(2)} max={0.6} />
      <div className={monStyles.readout}>
        <p>Overall accuracy: {weightedAccuracy(dist).toFixed(3)}</p>
        <p>Drift score vs. training: {drift.toFixed(4)} bits</p>
        <p className={isDrifting(TRAIN_DIST, dist) ? monStyles.alert : monStyles.ok}>
          {isDrifting(TRAIN_DIST, dist) ? "Alert: distribution has drifted" : "No drift detected"}
        </p>
      </div>
    </>
  );
}

/** Play beat: training vs. live, side by side — identical accuracy, very different distribution. */
export function PlayDemo() {
  return (
    <div className={monStyles.table}>
      <div className={monStyles.row}>
        <span className={monStyles.rowHeader}>snapshot</span>
        <span className={monStyles.rowHeader}>accuracy</span>
        <span className={monStyles.rowHeader}>drift vs. training</span>
      </div>
      <div className={monStyles.row}>
        <span>training</span>
        <span>{weightedAccuracy(TRAIN_DIST).toFixed(3)}</span>
        <span>0.0000 bits</span>
      </div>
      <div className={monStyles.row}>
        <span>live</span>
        <span>{weightedAccuracy(LIVE_DIST).toFixed(3)}</span>
        <span className={monStyles.alert}>{driftScore(TRAIN_DIST, LIVE_DIST).toFixed(4)} bits</span>
      </div>
      <p>
        An accuracy-only dashboard would show a flat line at {weightedAccuracy(TRAIN_DIST).toFixed(2)} across
        both snapshots. Nothing in that number says the input distribution moved at all.
      </p>
    </div>
  );
}

/** Checkpoint: three unseen candidates. Find the one whose accuracy looks unchanged but whose distribution has genuinely drifted past the alert threshold. */
export function DriftCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed =
    chosen !== null &&
    Math.abs(weightedAccuracy(CANDIDATES[chosen].dist) - weightedAccuracy(TRAIN_DIST)) < 0.005 &&
    isDrifting(TRAIN_DIST, CANDIDATES[chosen].dist);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Three candidate live distributions. Find the one whose accuracy looks unchanged from training
          (≈{weightedAccuracy(TRAIN_DIST).toFixed(2)}) — the one an accuracy-only dashboard would wave
          through — but whose distribution has genuinely drifted past the {DRIFT_ALERT_THRESHOLD}-bit alert
          threshold.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a candidate to try it"
    >
      <div className={monStyles.candidateList}>
        {CANDIDATES.map((c, i) => (
          <button
            key={c.label}
            type="button"
            className={i === chosen ? monStyles.candidateActive : monStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(i);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div className={monStyles.readout}>
          <p>Accuracy: {weightedAccuracy(CANDIDATES[chosen].dist).toFixed(3)}</p>
          <p>Drift vs. training: {driftScore(TRAIN_DIST, CANDIDATES[chosen].dist).toFixed(4)} bits</p>
        </div>
      )}
    </CheckpointFrame>
  );
}
