"use client";

import { useEffect, useState } from "react";
import { TreeFitPlayground } from "@/components/viz/TreeFitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { SCOREBOARD, BEST_VALIDATION_ACCURACY, TRAIN_POINTS, VALIDATION_POINTS, TREE_DOMAIN } from "@/lib/math-core/capstone-pipeline";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";
import scoreboardStyles from "./Scoreboard.module.css";

const CONCEPT_ID = "capstone-classifier-pipeline";
const TOLERANCE = 0.01;

function ModelPicker({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  return (
    <div className={styles.buttons}>
      {SCOREBOARD.map((entry) => (
        <button
          key={entry.key}
          type="button"
          className={entry.key === selected ? styles.buttonActive : styles.button}
          onClick={() => onSelect(entry.key)}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}

function ScoreboardTable({ highlight }: { highlight?: string }) {
  return (
    <table className={scoreboardStyles.table}>
      <thead>
        <tr>
          <th>Model</th>
          <th>Train</th>
          <th>Validation</th>
        </tr>
      </thead>
      <tbody>
        {SCOREBOARD.map((entry) => (
          <tr key={entry.key} className={entry.key === highlight ? scoreboardStyles.rowHighlight : undefined}>
            <td>{entry.label}</td>
            <td>{(entry.trainAccuracy * 100).toFixed(0)}%</td>
            <td>{(entry.validationAccuracy * 100).toFixed(0)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Intuition beat: switch between all four models, watch the fitted regions change on the exact same data. */
export function IntuitionDemo() {
  const [selected, setSelected] = useState("depth1");
  const entry = SCOREBOARD.find((e) => e.key === selected)!;
  return (
    <>
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={entry.regions}
        domain={TREE_DOMAIN}
        readout={`${entry.label} — validation accuracy = ${(entry.validationAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <ModelPicker selected={selected} onSelect={setSelected} />
      </div>
    </>
  );
}

/** Play beat: the full scoreboard, all four models side by side on train and validation accuracy. */
export function PlayDemo() {
  const [selected, setSelected] = useState("depth1");
  const entry = SCOREBOARD.find((e) => e.key === selected)!;
  return (
    <>
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={entry.regions}
        domain={TREE_DOMAIN}
        readout={`${entry.label}`}
      />
      <div className={styles.controls}>
        <ModelPicker selected={selected} onSelect={setSelected} />
      </div>
      <ScoreboardTable highlight={selected} />
    </>
  );
}

/** Checkpoint: pick whichever model(s) reach the best validation accuracy on the scoreboard. */
export function CapstoneCheckpoint() {
  const [selected, setSelected] = useState("depth6");
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const entry = SCOREBOARD.find((e) => e.key === selected)!;

  const passed = withinTolerance(entry.validationAccuracy, BEST_VALIDATION_ACCURACY, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick whichever model reaches the <strong>best validation accuracy</strong> on the scoreboard —{" "}
          <strong>{(BEST_VALIDATION_ACCURACY * 100).toFixed(0)}%</strong>. More than one row can be right.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a model to try it"
    >
      <TreeFitPlayground
        trainPoints={TRAIN_POINTS}
        validationPoints={VALIDATION_POINTS}
        regions={entry.regions}
        domain={TREE_DOMAIN}
        readout={`${entry.label} — validation accuracy = ${(entry.validationAccuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <ModelPicker
          selected={selected}
          onSelect={(key) => {
            setHasInteracted(true);
            setSelected(key);
          }}
        />
      </div>
      <ScoreboardTable highlight={selected} />
    </CheckpointFrame>
  );
}
