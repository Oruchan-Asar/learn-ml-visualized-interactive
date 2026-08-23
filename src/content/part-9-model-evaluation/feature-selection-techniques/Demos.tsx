"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { FEATURES, TARGET, relevanceScore, selectionScore, variance, MAX_SCORE } from "@/lib/math-core/feature-selection-techniques";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "feature-selection-techniques";
const TOLERANCE = 0.001;
const ALL_NAMES = FEATURES.map((f) => f.name);

function FeatureToggles({ selected, onToggle }: { selected: string[]; onToggle: (name: string) => void }) {
  return (
    <div className={styles.buttons}>
      {FEATURES.map((f) => (
        <button
          key={f.name}
          type="button"
          className={selected.includes(f.name) ? styles.buttonActive : styles.button}
          onClick={() => onToggle(f.name)}
        >
          {selected.includes(f.name) ? "✓ " : ""}
          {f.label}
        </button>
      ))}
    </div>
  );
}

function scoreBars(selected: string[]) {
  return FEATURES.map((f) => ({
    label: `${f.label}${selected.includes(f.name) ? "" : " (excluded)"}`,
    value: selected.includes(f.name) ? relevanceScore(f) : 0,
  }));
}

/** Intuition beat: toggle features on and off and watch each one's own predictive score, with zero formulas yet. */
export function IntuitionDemo() {
  const [selected, setSelected] = useState<string[]>(["hoursStudied"]);

  function toggle(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <>
      <FeatureToggles selected={selected} onToggle={toggle} />
      <ContributionBars
        items={scoreBars(selected)}
        max={1}
        formatValue={(v) => v.toFixed(2)}
        readout={`total score = ${selectionScore(selected).toFixed(3)} — classroom number never moves, no matter what you predict`}
      />
    </>
  );
}

/** Play beat: same widget, now framed around the R^2 formula and the variance-threshold filter. */
export function PlayDemo() {
  const [selected, setSelected] = useState<string[]>(ALL_NAMES.filter((n) => n !== "classroomNumber"));

  function toggle(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <>
      <FeatureToggles selected={selected} onToggle={toggle} />
      <ContributionBars
        items={scoreBars(selected)}
        max={1}
        formatValue={(v) => v.toFixed(2)}
        readout={`selectionScore = Σ R²(selected) = ${selectionScore(selected).toFixed(3)} — variance(classroomNumber) = ${variance(
          FEATURES.find((f) => f.name === "classroomNumber")!.values,
        ).toFixed(2)}`}
      />
    </>
  );
}

/** Checkpoint: toggle features to reach the maximum achievable total score. */
export function FeatureSelectionCheckpoint() {
  const [selected, setSelected] = useState<string[]>(["classroomNumber"]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const score = selectionScore(selected);
  const passed = withinTolerance(score, MAX_SCORE, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  function toggle(name: string) {
    setHasInteracted(true);
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <CheckpointFrame
      instructions={
        <>
          Toggle features on and off until the total score reaches its maximum, <strong>{MAX_SCORE.toFixed(3)}</strong>. Hint:
          {" "}<code>TARGET</code> = <code>2 &times; hoursStudied</code> exactly — one feature is worthless, four carry real signal.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Toggle a feature to try it"
    >
      <FeatureToggles selected={selected} onToggle={toggle} />
      <ContributionBars
        items={scoreBars(selected)}
        max={1}
        formatValue={(v) => v.toFixed(2)}
        readout={`total score = ${score.toFixed(3)} (target on ${TARGET.length} students: ${TARGET.join(", ")})`}
      />
    </CheckpointFrame>
  );
}
