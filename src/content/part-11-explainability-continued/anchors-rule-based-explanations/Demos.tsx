"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GRID_VALUES,
  model,
  evaluateAnchor,
  ANCHOR_SINGLE,
  ANCHOR_CONJUNCTION,
  ANCHOR_LOOSE_SINGLE,
  ANCHOR_LOOSE_CONJUNCTION,
  ANCHOR_TIGHT_CONJUNCTION,
  PRECISION_THRESHOLD,
} from "@/lib/math-core/anchors-rule-based-explanations";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "anchors-rule-based-explanations";
const RULES = [ANCHOR_SINGLE, ANCHOR_CONJUNCTION];
const CHECKPOINT_RULES = [ANCHOR_LOOSE_SINGLE, ANCHOR_LOOSE_CONJUNCTION, ANCHOR_TIGHT_CONJUNCTION];

function modelGrid(): number[][] {
  return GRID_VALUES.map((x1) => GRID_VALUES.map((x2) => model(x1, x2)));
}

/** Intuition beat: toggle between the two candidate anchor rules and see precision vs coverage trade off. */
export function IntuitionDemo() {
  const [ruleIndex, setRuleIndex] = useState(0);
  const rule = RULES[ruleIndex];
  const stats = evaluateAnchor(rule);
  return (
    <>
      <div className={styles.buttons}>
        {RULES.map((r, i) => (
          <button key={r.label} type="button" className={i === ruleIndex ? styles.buttonActive : styles.button} onClick={() => setRuleIndex(i)}>
            {r.label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "precision", value: stats.precision },
          { label: "coverage", value: stats.coverage },
        ]}
        formatValue={(v) => v.toFixed(3)}
        readout={`${stats.nMatching}/${stats.nSatisfying} points satisfying this rule share the instance's prediction`}
      />
    </>
  );
}

/** Play beat: the whole model, as a grid — the true positive region is a small corner, not the whole half-plane. */
export function PlayDemo() {
  return (
    <>
      <KernelHeatmap kernel={modelGrid()} label="Model prediction across the (x1,x2) grid — warm means predicted 1" />
      <ContributionBars
        items={RULES.map((r) => ({ label: r.label, value: evaluateAnchor(r).precision }))}
        formatValue={(v) => v.toFixed(3)}
        readout={`only the conjunction clears the ${PRECISION_THRESHOLD} precision bar an anchor actually requires`}
      />
    </>
  );
}

/**
 * Checkpoint: three rules never shown above — not the two from Intuition/Play, whose precision is
 * already on screen a moment earlier. Precision is hidden until "Check answer," so picking one requires
 * actually working through whether every point it covers shares the model's prediction, not reading a
 * bar chart. One rule (x2 > 0) is obviously too loose; the other two both add a second condition, but
 * only the correctly-thresholded one is actually reliable — "add a second condition" alone isn't enough.
 */
export function AnchorsCheckpoint() {
  const [ruleIndex, setRuleIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const stats = ruleIndex === null ? null : evaluateAnchor(CHECKPOINT_RULES[ruleIndex]);
  const passed = stats !== null && stats.precision >= PRECISION_THRESHOLD;

  useEffect(() => {
    if (revealed && passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [revealed, passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          None of these three rules appeared earlier. Work out which one clears the anchor algorithm&apos;s{" "}
          <strong>{PRECISION_THRESHOLD}</strong> precision requirement, pick it, then check.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      checkable
      revealed={revealed}
      onCheck={() => setRevealed(true)}
      idleLabel="Pick a rule, then check"
    >
      <div className={styles.buttons}>
        {CHECKPOINT_RULES.map((r, i) => (
          <button
            key={r.label}
            type="button"
            className={i === ruleIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setRevealed(false);
              setRuleIndex(i);
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      {revealed && stats && <ContributionBars items={[{ label: "precision", value: stats.precision }]} formatValue={(v) => v.toFixed(3)} />}
    </CheckpointFrame>
  );
}
