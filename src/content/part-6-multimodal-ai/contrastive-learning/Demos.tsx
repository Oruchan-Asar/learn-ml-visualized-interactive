"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  LABELS,
  IMAGES_BEFORE,
  CAPTIONS_BEFORE,
  IMAGES_AFTER,
  CAPTIONS_AFTER,
  similarityMatrix,
  rowSoftmax,
  contrastiveLoss,
  lerpPoints,
} from "@/lib/math-core/contrastive-learning";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "contrastive-learning";
const ROWCOL_LABEL = `rows = images (${LABELS.join(", ")}), columns = captions (${LABELS.join(", ")})`;

/** Intuition beat: toggle before/after training, watch the softmax probability matrix sharpen onto the diagonal. */
export function IntuitionDemo() {
  const [trained, setTrained] = useState(false);
  const images = trained ? IMAGES_AFTER : IMAGES_BEFORE;
  const captions = trained ? CAPTIONS_AFTER : CAPTIONS_BEFORE;
  const probs = rowSoftmax(similarityMatrix(images, captions));
  const loss = contrastiveLoss(images, captions);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!trained ? styles.buttonActive : styles.button} onClick={() => setTrained(false)}>
          Before training
        </button>
        <button type="button" className={trained ? styles.buttonActive : styles.button} onClick={() => setTrained(true)}>
          After training
        </button>
      </div>
      <KernelHeatmap kernel={probs} width={200} label={`${ROWCOL_LABEL} — loss ${loss.toFixed(3)}`} />
    </>
  );
}

/** Play beat: compare the raw similarity scores to the probabilities softmax turns them into. */
export function PlayDemo() {
  const [showProbs, setShowProbs] = useState(true);
  const raw = similarityMatrix(IMAGES_AFTER, CAPTIONS_AFTER);
  const probs = rowSoftmax(raw);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!showProbs ? styles.buttonActive : styles.button} onClick={() => setShowProbs(false)}>
          Raw similarity
        </button>
        <button type="button" className={showProbs ? styles.buttonActive : styles.button} onClick={() => setShowProbs(true)}>
          Softmax probability
        </button>
      </div>
      <KernelHeatmap kernel={showProbs ? probs : raw} width={200} label={ROWCOL_LABEL} />
    </>
  );
}

const TARGET_LOSS = 0.2;
const TOLERANCE = 0.02;

/**
 * Checkpoint: land training progress so the loss comes within 0.02 of exactly 0.2 — not "anything past
 * some threshold." That target sits in a narrow band, roughly progress 74-82%, so sliding to either
 * extreme and calling it done doesn't work — reaching it takes the same kind of estimate-then-refine
 * dragging as the worked example's own numbers (1.099 at 0%, 0.39 at 50%, 0.112 at 100%), not a single
 * lucky guess.
 */
export function ContrastiveCheckpoint() {
  const [progress, setProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const images = lerpPoints(IMAGES_BEFORE, IMAGES_AFTER, progress);
  const captions = lerpPoints(CAPTIONS_BEFORE, CAPTIONS_AFTER, progress);
  const loss = contrastiveLoss(images, captions);
  const passed = Math.abs(loss - TARGET_LOSS) <= TOLERANCE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Set training progress so the contrastive loss lands within <strong>0.02</strong> of exactly{" "}
          <strong>{TARGET_LOSS}</strong> — not just below it.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag to set training progress"
    >
      <KernelHeatmap
        kernel={rowSoftmax(similarityMatrix(images, captions))}
        width={200}
        label={`training progress ${(progress * 100).toFixed(0)}%  —  loss ${loss.toFixed(3)}`}
      />
      <label className={styles.sliderRow}>
        training progress
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={progress}
          onChange={(e) => {
            setHasInteracted(true);
            setProgress(Number(e.target.value));
          }}
        />
        {(progress * 100).toFixed(0)}%
      </label>
    </CheckpointFrame>
  );
}
