"use client";

import { useEffect, useState } from "react";
import { TokenChips } from "@/components/viz/TokenChips";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  SCRIPT,
  vocabId,
  stepWeights,
  stepWinner,
  sequenceAtStep,
  candidateEmbedding,
} from "@/lib/math-core/interleaved-multimodal-generation";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "interleaved-multimodal-generation";

function sequenceChips(n: number) {
  const seq = sequenceAtStep(n);
  return { tokens: seq.map((c) => c.label), ids: seq.map((c) => vocabId(c.label)) };
}

/** Intuition beat: step through generation one token at a time — text and image tokens interleaved in one stream. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const step = SCRIPT[i];
  const winner = stepWinner(step);
  const { tokens, ids } = sequenceChips(i + 1);

  return (
    <>
      <TokenChips tokens={tokens} ids={ids} />
      <p>
        step {i + 1}/{SCRIPT.length}: the model picked <strong>&ldquo;{winner.label}&rdquo;</strong> — a {winner.modality}{" "}
        token — out of {step.candidates.length} candidates.
      </p>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous step
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => setI((n) => Math.min(SCRIPT.length - 1, n + 1))}
        >
          Next step
        </button>
      </div>
    </>
  );
}

/** Play beat: see the softmax weights behind each decision, and the real patch embedding once an image token wins. */
export function PlayDemo() {
  const [i, setI] = useState(3); // land on the first image token by default
  const step = SCRIPT[i];
  const weights = stepWeights(step);
  const winner = stepWinner(step);
  const { tokens, ids } = sequenceChips(i + 1);
  const embedding = candidateEmbedding(winner);

  return (
    <>
      <TokenChips tokens={tokens} ids={ids} />
      <ContributionBars
        items={step.candidates.map((c, idx) => ({ label: c.label, value: weights[idx] }))}
        max={1}
        readout={
          embedding
            ? `winner "${winner.label}" is an image token — embedding (${embedding.join(", ")}), reused unchanged from the patch projector`
            : `winner "${winner.label}" is an ordinary text token`
        }
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous step
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => setI((n) => Math.min(SCRIPT.length - 1, n + 1))}
        >
          Next step
        </button>
      </div>
    </>
  );
}

/** Checkpoint: step forward until all four image patch tokens have appeared in the generated sequence. */
export function InterleavedGenerationCheckpoint() {
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const seq = sequenceAtStep(i + 1);
  const imageCount = seq.filter((c) => c.modality === "image").length;
  const passed = imageCount === 4;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Step forward until all <strong>four image patch tokens</strong> have appeared in the generated sequence.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Step forward to try it"
    >
      <TokenChips tokens={seq.map((c) => c.label)} ids={seq.map((c) => vocabId(c.label))} />
      <p>{imageCount}/4 image tokens generated so far</p>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setHasInteracted(true);
            setI((n) => Math.min(SCRIPT.length - 1, n + 1));
          }}
        >
          Next step
        </button>
      </div>
    </CheckpointFrame>
  );
}
