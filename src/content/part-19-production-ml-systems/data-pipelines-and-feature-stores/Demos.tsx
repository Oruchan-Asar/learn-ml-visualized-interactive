"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { EVENTS, LATEST_TIME, cumulativeBefore, buildTrainingSet, pointInTimeFeature } from "@/lib/math-core/data-pipelines-and-feature-stores";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import pipeStyles from "./Pipeline.module.css";

const CONCEPT_ID = "data-pipelines-and-feature-stores";
const MIN_T = 0;
const MAX_T = 10;

function Timeline({ queryTime }: { queryTime: number }) {
  return (
    <div className={pipeStyles.timeline}>
      {EVENTS.map((e) => (
        <div key={e.t}>
          <div className={pipeStyles.tick} style={{ left: `${(e.t / MAX_T) * 100}%` }} />
          <div className={pipeStyles.tickLabel} style={{ left: `${(e.t / MAX_T) * 100}%` }}>
            t={e.t}: ${e.amount}
          </div>
        </div>
      ))}
      <div className={pipeStyles.cursor} style={{ left: `${(queryTime / MAX_T) * 100}%` }} />
      <div className={pipeStyles.cursorLabel} style={{ left: `${(queryTime / MAX_T) * 100}%` }}>
        query t={queryTime}
      </div>
    </div>
  );
}

/** Intuition beat: slide a query time across the raw event stream and watch the same events sum to a different total. */
export function IntuitionDemo() {
  const [queryTime, setQueryTime] = useState(5);
  const value = cumulativeBefore(queryTime);

  return (
    <>
      <Timeline queryTime={queryTime} />
      <div className={styles.sliderRow}>
        <input
          type="range"
          min={MIN_T}
          max={MAX_T}
          step={1}
          value={queryTime}
          onChange={(e) => setQueryTime(Number(e.target.value))}
        />
      </div>
      <div className={pipeStyles.readout}>
        <p>
          Sum of every purchase that happened <strong>strictly before t={queryTime}</strong>: <strong>${value}</strong>
        </p>
        <p>Same six raw events the whole time — only the question &quot;as of when?&quot; changes the answer.</p>
      </div>
    </>
  );
}

/** Play beat: three training labels, each joined two ways — the correct point-in-time value versus a naive "current snapshot" join. */
export function PlayDemo() {
  const rows = buildTrainingSet();

  return (
    <div className={pipeStyles.table}>
      <div className={pipeStyles.row}>
        <span className={pipeStyles.rowHeader}>label time</span>
        <span className={pipeStyles.rowHeader}>correct (point-in-time)</span>
        <span className={pipeStyles.rowHeader}>naive (latest snapshot)</span>
        <span className={pipeStyles.rowHeader}>leaked</span>
      </div>
      {rows.map((r) => (
        <div key={r.labelTime} className={pipeStyles.row}>
          <span>t={r.labelTime}</span>
          <span>${r.correct}</span>
          <span>${r.naive}</span>
          <span className={pipeStyles.leak}>${r.leak}</span>
        </div>
      ))}
      <p>
        The naive join always returns the same ${cumulativeBefore(LATEST_TIME + 1)} — whatever the feature store
        happens to hold right now — no matter which historical moment the label actually came from.
      </p>
    </div>
  );
}

const CANDIDATES = [45, 95, 100, 130];

/** Checkpoint: compute the correct point-in-time feature for a label time never shown in the Play beat. */
export function PipelineCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const target = pointInTimeFeature(7);
  const passed = chosen === target;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>A new label arrives at <strong>t=7</strong>. Pick the correct point-in-time feature value — the sum of only the purchases that happened strictly before t=7.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <div className={pipeStyles.candidateList}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? pipeStyles.candidateActive : pipeStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            ${c}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
