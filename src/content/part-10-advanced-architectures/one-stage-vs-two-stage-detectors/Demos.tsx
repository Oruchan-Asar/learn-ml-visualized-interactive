"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  BOXES,
  oneStageScore,
  twoStageScore,
  isDetected,
  oneStageCost,
  twoStageCost,
  proposalSurvivorCount,
  detectionDisagreements,
  DETECTION_THRESHOLD,
} from "@/lib/math-core/one-stage-vs-two-stage-detectors";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "one-stage-vs-two-stage-detectors";
type Mode = "one-stage" | "two-stage";

function scoreFor(mode: Mode, trueConfidence: number): number {
  return mode === "one-stage" ? oneStageScore(trueConfidence) : twoStageScore(trueConfidence);
}

/** Intuition beat: same six boxes, same ground truth — toggle which pipeline scores them. */
export function IntuitionDemo() {
  const [mode, setMode] = useState<Mode>("one-stage");
  const items = BOXES.map((b) => {
    const score = scoreFor(mode, b.trueConfidence);
    return { label: `box ${b.id}${isDetected(score) ? " (detected)" : ""}`, value: score };
  });
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={mode === "one-stage" ? styles.buttonActive : styles.button} onClick={() => setMode("one-stage")}>
          one-stage (single pass)
        </button>
        <button type="button" className={mode === "two-stage" ? styles.buttonActive : styles.button} onClick={() => setMode("two-stage")}>
          two-stage (propose then classify)
        </button>
      </div>
      <ContributionBars
        items={items}
        formatValue={(v) => v.toFixed(2)}
        max={1}
        readout={`detection threshold: ${DETECTION_THRESHOLD} — a box below it doesn't count as detected`}
      />
    </>
  );
}

/** Play beat: the same scene, now scored both ways at once, plus the compute cost each pipeline actually spent. */
export function PlayDemo() {
  const scoreItems = BOXES.flatMap((b) => [
    { label: `${b.id} one-stage`, value: oneStageScore(b.trueConfidence) },
    { label: `${b.id} two-stage`, value: twoStageScore(b.trueConfidence) },
  ]);
  const disagreements = detectionDisagreements();
  return (
    <>
      <ContributionBars items={scoreItems} formatValue={(v) => v.toFixed(2)} max={1} readout={`disagreement on final detection: box ${disagreements.join(", ")}`} />
      <ContributionBars
        items={[
          { label: "one-stage total cost", value: oneStageCost() },
          { label: "two-stage total cost", value: twoStageCost() },
        ]}
        formatValue={(v) => v.toFixed(1)}
        readout={`two-stage refines only ${proposalSurvivorCount()} of ${BOXES.length} boxes, but that second pass still costs far more overall`}
      />
    </>
  );
}

/** Checkpoint: identify the one box where one-stage's coarse rounding and two-stage's refine pass disagree. */
export function DetectorCheckpoint() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const disagreements = detectionDisagreements();
  const passed = selected !== null && disagreements.includes(selected);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Pick the one box where <strong>one-stage</strong> and <strong>two-stage</strong> disagree about whether it&apos;s detected.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a box to try it"
    >
      <div className={styles.buttons}>
        {BOXES.map((b) => (
          <button
            key={b.id}
            type="button"
            className={b.id === selected ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setSelected(b.id);
            }}
          >
            box {b.id}
          </button>
        ))}
      </div>
      {selected !== null && (
        <ContributionBars
          items={[
            { label: "one-stage score", value: oneStageScore(BOXES.find((b) => b.id === selected)!.trueConfidence) },
            { label: "two-stage score", value: twoStageScore(BOXES.find((b) => b.id === selected)!.trueConfidence) },
          ]}
          formatValue={(v) => v.toFixed(2)}
          max={1}
        />
      )}
    </CheckpointFrame>
  );
}
