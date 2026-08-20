"use client";

import { useEffect, useState } from "react";
import { RegionBands } from "@/components/viz/RegionBands";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  DATA,
  DOMAIN,
  MODELS,
  STUMP,
  BLACK_BOX,
  SMALL_TREE,
  accuracy,
  interpretabilityScore,
  regionCount,
  type RegionModel,
} from "@/lib/math-core/interpretability-tradeoff";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "interpretability-accuracy-tradeoff";

function readoutFor(model: RegionModel): string {
  return `${model.name}: accuracy ${(accuracy(model) * 100).toFixed(0)}%, interpretability ${interpretabilityScore(model).toFixed(2)} (${regionCount(model)} region${regionCount(model) > 1 ? "s" : ""})`;
}

/** Intuition beat: flip between the simplest model and the most accurate one. */
export function IntuitionDemo() {
  const [showSimple, setShowSimple] = useState(true);
  const model = showSimple ? STUMP : BLACK_BOX;
  return (
    <>
      <div className={styles.buttons}>
        <button
          type="button"
          className={showSimple ? styles.buttonActive : styles.button}
          onClick={() => setShowSimple(true)}
        >
          Simple: one rule
        </button>
        <button
          type="button"
          className={!showSimple ? styles.buttonActive : styles.button}
          onClick={() => setShowSimple(false)}
        >
          Complex: memorized
        </button>
      </div>
      <RegionBands points={DATA} thresholds={model.thresholds} regionLabels={model.regionLabels} domain={DOMAIN} readout={readoutFor(model)} />
    </>
  );
}

/** Play beat: step through all three models, watching accuracy and interpretability move in opposite directions. */
export function PlayDemo() {
  const [index, setIndex] = useState(0);
  const model = MODELS[index];
  return (
    <>
      <div className={styles.buttons}>
        {MODELS.map((m, i) => (
          <button
            type="button"
            key={m.name}
            className={i === index ? styles.buttonActive : styles.button}
            onClick={() => setIndex(i)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <RegionBands points={DATA} thresholds={model.thresholds} regionLabels={model.regionLabels} domain={DOMAIN} readout={readoutFor(model)} />
    </>
  );
}

/** Checkpoint: pick the one model that clears both an accuracy floor and an interpretability floor at once. */
export function TradeoffCheckpoint() {
  const [choice, setChoice] = useState<RegionModel | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = choice !== null && accuracy(choice) >= 0.9 && interpretabilityScore(choice) > 0.3;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const model = choice ?? SMALL_TREE;

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick the model that reaches at least <strong>90% accuracy</strong> while keeping interpretability
          <strong> above 0.3</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a model to try it"
    >
      <div className={styles.buttons}>
        {MODELS.map((m) => (
          <button
            type="button"
            key={m.name}
            className={choice?.name === m.name ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChoice(m);
            }}
          >
            {m.name}
          </button>
        ))}
      </div>
      <RegionBands
        points={DATA}
        thresholds={model.thresholds}
        regionLabels={model.regionLabels}
        domain={DOMAIN}
        readout={choice ? readoutFor(choice) : "pick a model"}
      />
    </CheckpointFrame>
  );
}
