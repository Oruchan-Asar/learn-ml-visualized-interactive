"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { RELU_MAP, CLASS_LABELS, TRUE_CLASS_INDEX, channelWeight, computeGradCAM } from "@/lib/math-core/grad-cam";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "grad-cam";

/** Intuition beat: flip between the raw 4x4 feature map and its Grad-CAM for the predicted class. */
export function IntuitionDemo() {
  const [showCam, setShowCam] = useState(false);
  const cam = computeGradCAM(TRUE_CLASS_INDEX);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!showCam ? styles.buttonActive : styles.button} onClick={() => setShowCam(false)}>
          Feature map
        </button>
        <button type="button" className={showCam ? styles.buttonActive : styles.button} onClick={() => setShowCam(true)}>
          Grad-CAM
        </button>
      </div>
      <KernelHeatmap
        kernel={showCam ? cam : RELU_MAP}
        width={200}
        label={showCam ? `Grad-CAM for "${CLASS_LABELS[TRUE_CLASS_INDEX]}" — 4×4, one cell per pooling window` : "the conv layer's own 4×4 feature map (after ReLU)"}
      />
    </>
  );
}

/** Play beat: switch classes and watch the channel weight flip sign, along with the whole CAM. */
export function PlayDemo() {
  const [classIndex, setClassIndex] = useState(TRUE_CLASS_INDEX);
  const weight = channelWeight(classIndex);
  const cam = computeGradCAM(classIndex);
  return (
    <>
      <div className={styles.buttons}>
        {CLASS_LABELS.map((label, i) => (
          <button type="button" key={label} className={i === classIndex ? styles.buttonActive : styles.button} onClick={() => setClassIndex(i)}>
            {label}
          </button>
        ))}
      </div>
      <KernelHeatmap kernel={cam} width={200} label={`weight = ${weight.toFixed(2)} — Grad-CAM for "${CLASS_LABELS[classIndex]}"`} />
    </>
  );
}

/** Checkpoint: click the class whose Grad-CAM is entirely zero, i.e. has no positive evidence anywhere. */
export function GradCamCheckpoint() {
  const [choice, setChoice] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const allZero = (map: number[][]) => map.every((row) => row.every((v) => v === 0));
  const passed = choice !== null && allZero(computeGradCAM(choice));

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const cam = choice !== null ? computeGradCAM(choice) : RELU_MAP.map((row) => row.map(() => 0));

  return (
    <CheckpointFrame
      instructions={<>Pick the class whose Grad-CAM has <strong>no positive evidence anywhere</strong> — every cell exactly zero.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a class to try it"
    >
      <div className={styles.buttons}>
        {CLASS_LABELS.map((label, i) => (
          <button
            type="button"
            key={label}
            className={choice === i ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChoice(i);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <KernelHeatmap kernel={cam} width={200} label={choice !== null ? `Grad-CAM for "${CLASS_LABELS[choice]}"` : "pick a class"} />
    </CheckpointFrame>
  );
}
