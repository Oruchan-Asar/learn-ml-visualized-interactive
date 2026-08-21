"use client";

import { useEffect, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { CODEBOOK, ENCODER_OUTPUTS, nearestCodeIndex, quantizationError } from "@/lib/math-core/vq-vae-discrete-latents";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "vq-vae-discrete-latents";
const CODE_LABELS = CODEBOOK.map((_, i) => `code ${i}`);
const CODE_WORDS = CODEBOOK.map((c, i) => ({ label: CODE_LABELS[i], x: c.x, y: c.y, shape: "square" as const }));
const DOMAIN: [number, number] = [-1, 4];

/** Intuition beat: pick one of four continuous encoder outputs and watch it snap to its nearest codebook entry. */
export function IntuitionDemo() {
  const [imageIndex, setImageIndex] = useState(0);
  const z = ENCODER_OUTPUTS[imageIndex];
  const nearest = nearestCodeIndex(z);
  const error = quantizationError(z);

  return (
    <>
      <div className={styles.buttons}>
        {ENCODER_OUTPUTS.map((_, i) => (
          <button key={i} type="button" className={i === imageIndex ? styles.buttonActive : styles.button} onClick={() => setImageIndex(i)}>
            image {i}
          </button>
        ))}
      </div>
      <WordEmbeddingSpace
        words={CODE_WORDS}
        nearestLabel={CODE_LABELS[nearest]}
        extraPoint={{ x: z.x, y: z.y, label: "zₑ" }}
        domain={DOMAIN}
        readout={`zₑ = (${z.x}, ${z.y}) → snapped to ${CODE_LABELS[nearest]}, quantization error = ${error.toFixed(3)}`}
      />
    </>
  );
}

/** Play beat: every encoder output's quantization error side by side — how far each continuous vector was from the code it got replaced by. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={ENCODER_OUTPUTS.map((z, i) => ({ label: `image ${i} → ${CODE_LABELS[nearestCodeIndex(z)]}`, value: quantizationError(z) }))}
      formatValue={(v) => v.toFixed(3)}
      readout="four different continuous vectors, four different codes used — a discrete vocabulary emerging from where the encoder actually places things"
    />
  );
}

/** Checkpoint: find the encoder output with the LARGEST quantization error. */
export function VQVAECheckpoint() {
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const errors = ENCODER_OUTPUTS.map((z) => quantizationError(z));
  const maxError = Math.max(...errors);
  const chosenError = imageIndex === null ? null : errors[imageIndex];
  const passed = chosenError !== null && chosenError === maxError;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the encoder output, among the four images, with the <strong>largest</strong> quantization error.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an image to try it"
    >
      <div className={styles.buttons}>
        {ENCODER_OUTPUTS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={i === imageIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setImageIndex(i);
            }}
          >
            image {i}
          </button>
        ))}
      </div>
      {chosenError !== null && <ContributionBars items={[{ label: "quantization error", value: chosenError }]} formatValue={(v) => v.toFixed(3)} max={maxError} />}
    </CheckpointFrame>
  );
}
