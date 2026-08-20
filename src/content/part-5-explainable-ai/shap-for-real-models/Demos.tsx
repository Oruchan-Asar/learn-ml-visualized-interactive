"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  FEATURE_KEYS,
  FEATURE_NAMES,
  INSTANCE,
  BASELINE_PREDICTION,
  predict,
  allShapValues,
} from "@/lib/math-core/shap-linear";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "shap-for-real-models";

/** Intuition beat: the fixed instance's SHAP breakdown — every bar sums exactly to prediction minus baseline. */
export function IntuitionDemo() {
  const values = allShapValues();
  const items = FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: values[k] }));
  const sum = FEATURE_KEYS.reduce((s, k) => s + values[k], 0);
  return (
    <ContributionBars
      items={items}
      readout={`baseline ${BASELINE_PREDICTION} + ${sum.toFixed(0)} = ${predict(INSTANCE).toFixed(0)} (this house's predicted price)`}
    />
  );
}

function SizeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>size = {value.toFixed(0)}</label>
      <input id={id} type="range" min={10} max={35} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** Play beat: drag one feature and watch only its own bar move, while the total still tracks the prediction. */
export function PlayDemo() {
  const [size, setSize] = useState(INSTANCE.size);
  const features = { ...INSTANCE, size };
  const values = allShapValues(features);
  const items = FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: values[k] }));
  const sum = FEATURE_KEYS.reduce((s, k) => s + values[k], 0);
  return (
    <>
      <ContributionBars
        items={items}
        readout={`baseline ${BASELINE_PREDICTION} + ${sum.toFixed(0)} = ${predict(features).toFixed(0)}`}
      />
      <div className={styles.controls}>
        <SizeSlider value={size} onChange={setSize} />
      </div>
    </>
  );
}

/** Checkpoint: drag size until its own SHAP contribution reaches a target. */
export function ShapLinearCheckpoint() {
  const [size, setSize] = useState(INSTANCE.size);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const features = { ...INSTANCE, size };
  const values = allShapValues(features);
  const passed = values.size >= 90;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const items = FEATURE_KEYS.map((k) => ({ label: FEATURE_NAMES[k], value: values[k] }));

  return (
    <CheckpointFrame
      instructions={<>Drag size until its own SHAP contribution reaches at least <strong>90</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <ContributionBars items={items} readout={`size's contribution: ${values.size.toFixed(0)}`} />
      <div className={styles.controls}>
        <SizeSlider
          value={size}
          onChange={(v) => {
            setHasInteracted(true);
            setSize(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
