"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GRADIENTS,
  fullBatchAverage,
  toShardSummaries,
  naiveAverage,
  weightedAverage,
  EQUAL_SHARDS,
  UNEQUAL_SHARDS,
  CHECKPOINT_SHARDS,
} from "@/lib/math-core/distributed-training";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import workerStyles from "./Workers.module.css";

const CONCEPT_ID = "distributed-training";
const FULL_AVG = fullBatchAverage(GRADIENTS);

function WorkerCards({ shards }: { shards: number[][] }) {
  const summaries = toShardSummaries(shards);
  return (
    <div className={workerStyles.workers}>
      {shards.map((shard, i) => (
        <div key={i} className={workerStyles.workerCard}>
          <p>
            <strong>worker {i + 1}</strong>
          </p>
          <p>examples: [{shard.join(", ")}]</p>
          <p>
            avg = {summaries[i].avg} (n={summaries[i].size})
          </p>
        </div>
      ))}
    </div>
  );
}

/** Intuition beat: split the same six gradients across workers of equal size, average their averages, compare to the single-machine batch average. */
export function IntuitionDemo() {
  const [mode, setMode] = useState<"equal" | "unequal">("equal");
  const shards = mode === "equal" ? EQUAL_SHARDS : UNEQUAL_SHARDS;
  const summaries = toShardSummaries(shards);
  const naive = naiveAverage(summaries.map((s) => s.avg));
  const weighted = weightedAverage(summaries);
  const naiveMatches = Math.abs(naive - FULL_AVG) < 1e-9;

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={mode === "equal" ? styles.buttonActive : styles.button} onClick={() => setMode("equal")}>
          equal-sized shards
        </button>
        <button type="button" className={mode === "unequal" ? styles.buttonActive : styles.button} onClick={() => setMode("unequal")}>
          unequal-sized shards
        </button>
      </div>
      <WorkerCards shards={shards} />
      <div className={workerStyles.readout}>
        <p>Single machine, full batch of six: average gradient = {FULL_AVG}</p>
        <p>Naive average of worker averages = {naive}</p>
        <p className={naiveMatches ? workerStyles.match : workerStyles.mismatch}>
          {naiveMatches ? "Matches the full-batch average" : "Does NOT match the full-batch average"}
        </p>
        <p>Weighted average (by shard size) = {weighted} — always matches</p>
      </div>
    </>
  );
}

/** Play beat: equal vs. unequal shards side by side, showing exactly when naive averaging breaks. */
export function PlayDemo() {
  const rows = [
    { label: "equal shards", shards: EQUAL_SHARDS },
    { label: "unequal shards", shards: UNEQUAL_SHARDS },
  ];

  return (
    <div className={workerStyles.readout}>
      {rows.map((row) => {
        const summaries = toShardSummaries(row.shards);
        const naive = naiveAverage(summaries.map((s) => s.avg));
        const weighted = weightedAverage(summaries);
        return (
          <p key={row.label}>
            <strong>{row.label}</strong> (sizes {summaries.map((s) => s.size).join("/")}): naive = {naive}
            {", "}
            weighted = {weighted}
            {", "}
            full-batch = {FULL_AVG}
            {" — naive "}
            <span className={Math.abs(naive - FULL_AVG) < 1e-9 ? workerStyles.match : workerStyles.mismatch}>
              {Math.abs(naive - FULL_AVG) < 1e-9 ? "matches" : "does not match"}
            </span>
          </p>
        );
      })}
    </div>
  );
}

const CANDIDATES = [1.5, 2, 2.5, 4];

/** Checkpoint: a third, unseen partition into unequal shards — compute the combined gradient a single machine would have produced. */
export function DistributedCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = chosen !== null && Math.abs(chosen - FULL_AVG) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Three workers report their own average gradient over an unequal split of the same six examples.
          Combine them correctly — the value a single machine would have computed over all six at once.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <WorkerCards shards={CHECKPOINT_SHARDS} />
      <div className={workerStyles.candidateList}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? workerStyles.candidateActive : workerStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
