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

/** Checkpoint: find the state where the loss drops below a target. */
export function ContrastiveCheckpoint() {
  const [trained, setTrained] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const images = trained ? IMAGES_AFTER : IMAGES_BEFORE;
  const captions = trained ? CAPTIONS_AFTER : CAPTIONS_BEFORE;
  const loss = contrastiveLoss(images, captions);
  const passed = loss < 0.2;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the state where the contrastive loss drops below <strong>0.2</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Toggle the state to try it"
    >
      <div className={styles.buttons}>
        <button
          type="button"
          className={!trained ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setTrained(false);
          }}
        >
          Before training
        </button>
        <button
          type="button"
          className={trained ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setTrained(true);
          }}
        >
          After training
        </button>
      </div>
      <KernelHeatmap kernel={rowSoftmax(similarityMatrix(images, captions))} width={200} label={`loss ${loss.toFixed(3)}`} />
    </CheckpointFrame>
  );
}
