"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  IMAGE,
  CLASS_LABELS,
  BASE_PREDICTED_INDEX,
  computeSaliencyMap,
} from "@/lib/math-core/saliency-maps";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "saliency-maps";
const SALIENCY_MAP = computeSaliencyMap();

/** Intuition beat: flip between the raw image and its saliency map for the predicted class. */
export function IntuitionDemo() {
  const [showSaliency, setShowSaliency] = useState(false);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!showSaliency ? styles.buttonActive : styles.button} onClick={() => setShowSaliency(false)}>
          Image
        </button>
        <button type="button" className={showSaliency ? styles.buttonActive : styles.button} onClick={() => setShowSaliency(true)}>
          Saliency map
        </button>
      </div>
      <KernelHeatmap
        kernel={showSaliency ? SALIENCY_MAP : IMAGE}
        width={220}
        label={
          showSaliency
            ? `|∂ "${CLASS_LABELS[BASE_PREDICTED_INDEX]}" logit / ∂ pixel|`
            : "the 6×6 input image (1 = light, 0 = dark)"
        }
      />
    </>
  );
}

/** Play beat: check saliency against either output neuron — same evidence, same map. */
export function PlayDemo() {
  const [classIndex, setClassIndex] = useState(BASE_PREDICTED_INDEX);
  const map = computeSaliencyMap(classIndex);
  return (
    <>
      <div className={styles.buttons}>
        {CLASS_LABELS.map((label, i) => (
          <button type="button" key={label} className={i === classIndex ? styles.buttonActive : styles.button} onClick={() => setClassIndex(i)}>
            {label}
          </button>
        ))}
      </div>
      <KernelHeatmap kernel={map} width={220} label={`saliency for "${CLASS_LABELS[classIndex]}"`} />
    </>
  );
}

/** Checkpoint: click any pixel the model gives exactly zero weight to. */
export function SaliencyCheckpoint() {
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = selected !== null && SALIENCY_MAP[selected.row][selected.col] === 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Click any pixel the model gives <strong>exactly zero</strong> weight to — one it never uses to make this decision.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a pixel to try it"
    >
      <KernelHeatmap
        kernel={SALIENCY_MAP}
        width={220}
        label={selected ? `pixel (${selected.row}, ${selected.col}): saliency ${SALIENCY_MAP[selected.row][selected.col].toFixed(2)}` : "click a pixel"}
        selected={selected}
        onCellClick={(row, col) => {
          setHasInteracted(true);
          setSelected({ row, col });
        }}
      />
    </CheckpointFrame>
  );
}
