"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { franceRomeScore, germanyBerlinScore } from "@/lib/math-core/model-editing-rome-memit";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "model-editing-rome-memit";
const TARGET_SCORE = 1;
const TOLERANCE = 0.05;

function scoreItems(alpha: number) {
  return [
    { label: "France → Rome retrieval", value: franceRomeScore(alpha) },
    { label: "Germany → Berlin retrieval (control)", value: germanyBerlinScore(alpha) },
  ];
}

/** Intuition beat: no edit vs. full edit — the France fact jumps to Rome, Germany never moves. */
export function IntuitionDemo() {
  const [alpha, setAlpha] = useState(0);

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={alpha === 0 ? styles.buttonActive : styles.button} onClick={() => setAlpha(0)}>
          no edit (α = 0)
        </button>
        <button type="button" className={alpha === 1 ? styles.buttonActive : styles.button} onClick={() => setAlpha(1)}>
          full edit (α = 1)
        </button>
      </div>
      <ContributionBars
        items={scoreItems(alpha)}
        formatValue={(v) => v.toFixed(2)}
        max={1}
        readout="the control fact's score never budges — its key is orthogonal to the edited key"
      />
    </>
  );
}

/** Play beat: drag the edit strength and watch the France fact's retrieval score climb linearly while Germany's stays pinned at 1.0. */
export function PlayDemo() {
  const [alpha, setAlpha] = useState(0.5);

  return (
    <>
      <ContributionBars items={scoreItems(alpha)} formatValue={(v) => v.toFixed(3)} max={1} readout={`α = ${alpha.toFixed(2)}`} />
      <label className={styles.sliderRow}>
        edit strength α
        <input type="range" min={0} max={1} step={0.01} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
        {alpha.toFixed(2)}
      </label>
    </>
  );
}

/** Checkpoint: push the edit strength up until the France fact reliably retrieves Rome. */
export function ModelEditingCheckpoint() {
  const [alpha, setAlpha] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const score = franceRomeScore(alpha);
  const passed = withinTolerance(score, TARGET_SCORE, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Increase the edit strength <code>α</code> until the France fact&apos;s Rome-retrieval score reaches at least <strong>0.95</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the slider to try it"
    >
      <ContributionBars items={scoreItems(alpha)} formatValue={(v) => v.toFixed(3)} max={1} />
      <label className={styles.sliderRow}>
        edit strength α
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={alpha}
          onChange={(e) => {
            setHasInteracted(true);
            setAlpha(Number(e.target.value));
          }}
        />
        {alpha.toFixed(2)}
      </label>
    </CheckpointFrame>
  );
}
