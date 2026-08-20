"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  FEATURE_KEYS,
  FEATURE_NAMES,
  BASELINE_FEATURES,
  INSTANCE,
  predict,
  saliency,
  shapValue,
  counterfactualDelta,
  THRESHOLD,
} from "@/lib/math-core/capstone-explain-one-prediction";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-explain-one-prediction-three-ways";

const LENSES = ["Saliency", "SHAP", "Counterfactual"] as const;
type Lens = (typeof LENSES)[number];

function itemsFor(lens: Lens): { label: string; value: number }[] {
  if (lens === "Saliency") return FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: saliency(k) }));
  if (lens === "SHAP") return FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: shapValue(k) }));
  const delta = counterfactualDelta();
  return FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: delta[k] }));
}

function readoutFor(lens: Lens): string {
  if (lens === "Saliency") return "|weight| — the same for every house, this one included; it never looks at an actual value";
  if (lens === "SHAP") return `explains the predicted price: ${predict(INSTANCE)}`;
  return `explains the approval decision (threshold ${THRESHOLD}): change needed in each feature to flip it`;
}

/** Intuition beat: the same house, the same four features, three different lenses. */
export function IntuitionDemo() {
  const [lens, setLens] = useState<Lens>("SHAP");
  return (
    <>
      <div className={styles.buttons}>
        {LENSES.map((l) => (
          <button type="button" key={l} className={l === lens ? styles.buttonActive : styles.button} onClick={() => setLens(l)}>
            {l}
          </button>
        ))}
      </div>
      <ContributionBars items={itemsFor(lens)} readout={readoutFor(lens)} />
    </>
  );
}

/** Play beat: saliency never changes between two very different houses — SHAP does. */
export function PlayDemo() {
  const [useBaseline, setUseBaseline] = useState(false);
  const features = useBaseline ? BASELINE_FEATURES : INSTANCE;
  const salItems = FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: saliency(k) }));
  const shapItems = FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: shapValue(k, features) }));
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!useBaseline ? styles.buttonActive : styles.button} onClick={() => setUseBaseline(false)}>
          This house (predicts {predict(INSTANCE)})
        </button>
        <button type="button" className={useBaseline ? styles.buttonActive : styles.button} onClick={() => setUseBaseline(true)}>
          Baseline house (predicts {predict(BASELINE_FEATURES)})
        </button>
      </div>
      <ContributionBars items={salItems} readout="saliency — identical either way" />
      <ContributionBars items={shapItems} readout="SHAP — changes with the house" />
    </>
  );
}

/** Checkpoint: only one of the three lenses gives a feature exactly zero when that feature sits at its own baseline. */
export function CapstoneCheckpoint() {
  const [choice, setChoice] = useState<Lens | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = choice === "SHAP";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Age sits exactly at its baseline value in some hypothetical house. Which lens would show age
          contributing <strong>exactly zero</strong> in that case?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a lens to try it"
    >
      <div className={styles.buttons}>
        {LENSES.map((l) => (
          <button
            type="button"
            key={l}
            className={choice === l ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChoice(l);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {choice && <ContributionBars items={itemsFor(choice)} readout={readoutFor(choice)} />}
    </CheckpointFrame>
  );
}
