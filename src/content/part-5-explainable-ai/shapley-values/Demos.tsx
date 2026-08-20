"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  FEATURE_KEYS,
  FEATURE_NAMES,
  ALL_ORDERINGS,
  marginalContribution,
  allShapleyValues,
  BASELINE,
  FULL_VALUE,
  type FeatureKey,
} from "@/lib/math-core/shapley-values";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "shapley-values";
const SHAPLEY = allShapleyValues();

/** Intuition beat: the Shapley value for all three features — a single, unique split of credit. */
export function IntuitionDemo() {
  const items = FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: SHAPLEY[k] }));
  return (
    <ContributionBars
      items={items}
      readout={`baseline ${BASELINE} + ${(SHAPLEY.A + SHAPLEY.B + SHAPLEY.C).toFixed(1)} = ${FULL_VALUE} (the full pizza's score)`}
    />
  );
}

/** Play beat: pick one of the 6 arrival orders and see how much each feature contributes right there — then compare to the average. */
export function PlayDemo() {
  const [orderIndex, setOrderIndex] = useState(0);
  const ordering = ALL_ORDERINGS[orderIndex];
  const items = ordering.map((f) => ({ label: FEATURE_NAMES[f], value: marginalContribution(ordering, f) }));
  return (
    <>
      <div className={styles.buttons}>
        {ALL_ORDERINGS.map((o, i) => (
          <button type="button" key={o.join("")} className={i === orderIndex ? styles.buttonActive : styles.button} onClick={() => setOrderIndex(i)}>
            {o.join(" → ")}
          </button>
        ))}
      </div>
      <ContributionBars items={items} readout="this one ordering's marginal contributions — compare to the averaged Shapley values above" />
    </>
  );
}

/** Checkpoint: identify the one feature with the lowest Shapley value. */
export function ShapleyCheckpoint() {
  const [choice, setChoice] = useState<FeatureKey | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const lowest = FEATURE_KEYS.reduce((best, f) => (SHAPLEY[f] < SHAPLEY[best] ? f : best));
  const passed = choice === lowest;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const items = FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: SHAPLEY[k] }));

  return (
    <CheckpointFrame
      instructions={<>Pick the feature with the <strong>lowest</strong> Shapley value.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a feature to try it"
    >
      <div className={styles.buttons}>
        {FEATURE_KEYS.map((k) => (
          <button
            type="button"
            key={k}
            className={choice === k ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChoice(k);
            }}
          >
            {FEATURE_NAMES[k]}
          </button>
        ))}
      </div>
      <ContributionBars items={items} readout={choice ? `you picked "${FEATURE_NAMES[choice]}"` : "pick a feature"} />
    </CheckpointFrame>
  );
}
