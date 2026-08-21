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

/**
 * Checkpoint: drag a continuous "training progress" slider (0 = BEFORE, 1 = AFTER) until the loss drops
 * below the target — the loss falls smoothly and only crosses 0.2 around 78% of the way through, so
 * there's no shortcut label to read off; the learner has to actually watch the number.
 */
export function ContrastiveCheckpoint() {
  const [progress, setProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const images = lerpPoints(IMAGES_BEFORE, IMAGES_AFTER, progress);
  const captions = lerpPoints(CAPTIONS_BEFORE, CAPTIONS_AFTER, progress);
  const loss = contrastiveLoss(images, captions);
  const passed = loss < 0.2;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag training progress until the contrastive loss drops below <strong>0.2</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
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
