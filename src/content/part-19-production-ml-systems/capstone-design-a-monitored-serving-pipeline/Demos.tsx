"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  BIN_LABELS,
  runStaticIngestionTests,
  runPipeline,
  DAILY_DISTRIBUTIONS,
  DRIFT_ALERT_THRESHOLD,
  isDrifting,
  weightedAccuracy,
  driftScore,
  CHECKPOINT_CANDIDATES,
} from "@/lib/math-core/capstone-design-a-monitored-serving-pipeline";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import pipeStyles from "./Pipeline.module.css";

const CONCEPT_ID = "capstone-design-a-monitored-serving-pipeline";
const STATIC_TESTS = runStaticIngestionTests();

/** Intuition beat: step through three days of live traffic, watching the static ingestion tests, accuracy, and drift score all report at once. */
export function IntuitionDemo() {
  const [day, setDay] = useState(0);
  const report = runPipeline(DAILY_DISTRIBUTIONS)[day];

  return (
    <>
      <div className={styles.buttons}>
        {DAILY_DISTRIBUTIONS.map((_, i) => (
          <button key={i} type="button" className={i === day ? styles.buttonActive : styles.button} onClick={() => setDay(i)}>
            day {i + 1}
          </button>
        ))}
      </div>
      <ContributionBars
        items={report.dist.map((v, i) => ({ label: BIN_LABELS[i], value: v }))}
        formatValue={(v) => v.toFixed(2)}
        max={0.6}
      />
      <div className={pipeStyles.readout}>
        <p className={pipeStyles.ok}>Ingestion: static join tests {STATIC_TESTS.filter((t) => t.passed).length}/{STATIC_TESTS.length} passing</p>
        <p>Serving: accuracy = {report.accuracy.toFixed(3)}</p>
        <p>Monitoring: drift = {report.drift.toFixed(4)} bits (threshold {DRIFT_ALERT_THRESHOLD})</p>
        <p className={report.alarm ? pipeStyles.alert : pipeStyles.ok}>{report.alarm ? "ALARM — investigate live traffic" : "All clear"}</p>
      </div>
    </>
  );
}

/** Play beat: all three days side by side — the static tests never move, accuracy barely moves, but drift catches day 3. */
export function PlayDemo() {
  const reports = runPipeline(DAILY_DISTRIBUTIONS);

  return (
    <div className={pipeStyles.table}>
      <div className={pipeStyles.row}>
        <span className={pipeStyles.rowHeader}>day</span>
        <span className={pipeStyles.rowHeader}>static tests</span>
        <span className={pipeStyles.rowHeader}>accuracy</span>
        <span className={pipeStyles.rowHeader}>drift</span>
        <span className={pipeStyles.rowHeader}>alarm</span>
      </div>
      {reports.map((r) => (
        <div key={r.day} className={pipeStyles.row}>
          <span>{r.day}</span>
          <span className={pipeStyles.ok}>{r.staticTestsPassed ? "passing" : "failing"}</span>
          <span>{r.accuracy.toFixed(3)}</span>
          <span>{r.drift.toFixed(4)}</span>
          <span className={r.alarm ? pipeStyles.alert : pipeStyles.ok}>{r.alarm ? "yes" : "no"}</span>
        </div>
      ))}
      <p>
        Day 3&apos;s accuracy is identical to day 1&apos;s. A dashboard watching accuracy — or a CI suite
        checking the join logic — would report nothing wrong on any of these three days.
      </p>
    </div>
  );
}

/** Checkpoint: three unseen candidate days. Find the one whose problem accuracy monitoring alone would miss, exactly like day 3. */
export function PipelineCheckpoint() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chosenCandidate = CHECKPOINT_CANDIDATES.find((c) => c.label === chosen);
  const passed =
    chosenCandidate !== undefined &&
    Math.abs(weightedAccuracy(chosenCandidate.dist) - 0.8) < 0.005 &&
    isDrifting(chosenCandidate.dist);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Three new candidate days. Find the one whose accuracy looks completely normal — the static tests
          are green, the accuracy dashboard is flat — but that a drift alarm should still catch, exactly like
          day 3.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a candidate to try it"
    >
      <div className={pipeStyles.candidateList}>
        {CHECKPOINT_CANDIDATES.map((c) => (
          <button
            key={c.label}
            type="button"
            className={c.label === chosen ? pipeStyles.candidateActive : pipeStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c.label);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {chosenCandidate && (
        <div className={pipeStyles.readout}>
          <p>Accuracy: {weightedAccuracy(chosenCandidate.dist).toFixed(3)}</p>
          <p>Drift: {driftScore(chosenCandidate.dist).toFixed(4)} bits</p>
        </div>
      )}
    </CheckpointFrame>
  );
}
