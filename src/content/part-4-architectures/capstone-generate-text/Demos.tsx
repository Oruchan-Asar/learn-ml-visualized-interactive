"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  VOCAB,
  EXAMPLES,
  EPOCHS_PER_STEP,
  TARGET_LOSS,
  initialParams,
  meanLoss,
  trainEpochs,
  forward,
  generate,
  type TinyTransformerParams,
} from "@/lib/math-core/capstone-tiny-transformer";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-generate-text";
const SEED_CONTEXT = EXAMPLES[0].context; // "abc"

function useTraining() {
  const [params, setParams] = useState<TinyTransformerParams>(initialParams);
  const [epoch, setEpoch] = useState(0);

  const train = () => {
    setParams((p) => trainEpochs(p, EPOCHS_PER_STEP));
    setEpoch((e) => e + EPOCHS_PER_STEP);
  };
  const reset = () => {
    setParams(initialParams());
    setEpoch(0);
  };

  return { params, epoch, train, reset };
}

function TrainResetButtons({ onTrain, onReset }: { onTrain: () => void; onReset: () => void }) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={styles.buttonPrimary} onClick={onTrain}>
        Train {EPOCHS_PER_STEP} epochs
      </button>
      <button type="button" className={styles.button} onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

function TrainingView({ params, epoch }: { params: TinyTransformerParams; epoch: number }) {
  const loss = meanLoss(params);
  const { attentionWeights, probs } = forward(params, SEED_CONTEXT);
  const generated = generate(params, SEED_CONTEXT, 9);
  return (
    <>
      <KernelHeatmap kernel={attentionWeights} label={`self-attention over "abc" (rows = query position, cols = key position)`} width={180} />
      <p className={styles.controls}>
        next-character probabilities: {VOCAB.map((c, i) => `${c}=${probs[i].toFixed(2)}`).join(", ")}
      </p>
      <p className={styles.controls}>
        generated from &ldquo;abc&rdquo;: <strong>{generated}</strong>
      </p>
      <p className={styles.controls}>
        epoch {epoch} — loss = {loss.toFixed(4)}
      </p>
    </>
  );
}

/** Intuition beat: train the tiny Transformer and watch it learn to complete the repeating pattern. */
export function IntuitionDemo() {
  const { params, epoch, train, reset } = useTraining();
  return (
    <>
      <TrainingView params={params} epoch={epoch} />
      <div className={styles.controls}>
        <TrainResetButtons onTrain={train} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: same training loop — watch the attention pattern and predicted probabilities sharpen together. */
export function PlayDemo() {
  const { params, epoch, train, reset } = useTraining();
  return (
    <>
      <TrainingView params={params} epoch={epoch} />
      <div className={styles.controls}>
        <TrainResetButtons onTrain={train} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: train until the model reliably completes "abc" with the correct next character. */
export function TinyTransformerCheckpoint() {
  const { params, epoch, train, reset } = useTraining();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const loss = meanLoss(params);

  const passed = loss < TARGET_LOSS;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Train the tiny Transformer until its loss drops below <strong>{TARGET_LOSS}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click train to try it"
    >
      <TrainingView params={params} epoch={epoch} />
      <div className={styles.controls}>
        <TrainResetButtons
          onTrain={() => {
            setHasInteracted(true);
            train();
          }}
          onReset={reset}
        />
      </div>
    </CheckpointFrame>
  );
}
