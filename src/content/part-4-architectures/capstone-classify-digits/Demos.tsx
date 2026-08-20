"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TRAINING_SET,
  CLASS_LABELS,
  EPOCHS_PER_STEP,
  TARGET_LOSS,
  HAND_DESIGNED_KERNEL,
  initialWeights,
  meanLoss,
  trainEpochs,
  forward,
  argmax,
  type CnnWeights,
} from "@/lib/math-core/capstone-classify-digits";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import gridStyles from "./DigitGrid.module.css";

const CONCEPT_ID = "capstone-classify-digits";

function useTraining() {
  const [weights, setWeights] = useState<CnnWeights>(initialWeights);
  const [epoch, setEpoch] = useState(0);

  const train = () => {
    setWeights((w) => trainEpochs(w, EPOCHS_PER_STEP));
    setEpoch((e) => e + EPOCHS_PER_STEP);
  };
  const reset = () => {
    setWeights(initialWeights());
    setEpoch(0);
  };

  return { weights, epoch, train, reset };
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

function DigitImage({ image }: { image: number[][] }) {
  const size = image.length;
  return (
    <div className={gridStyles.grid} style={{ gridTemplateColumns: `repeat(${size}, 14px)` }}>
      {image.flatMap((row, r) =>
        row.map((v, c) => (
          <div key={`${r}-${c}`} className={v > 0 ? gridStyles.cellLight : gridStyles.cellDark} />
        )),
      )}
    </div>
  );
}

function ClassificationRow({ weights }: { weights: CnnWeights }) {
  return (
    <div className={gridStyles.row}>
      {TRAINING_SET.map((ex, i) => {
        const { logits, probs } = forward(weights, ex.image);
        const predicted = argmax(logits);
        const correct = predicted === ex.label;
        return (
          <div key={i} className={correct ? gridStyles.cardCorrect : gridStyles.cardWrong}>
            <DigitImage image={ex.image} />
            <div className={gridStyles.cardLabel}>
              true: {CLASS_LABELS[ex.label]}
              <br />
              predicted: {CLASS_LABELS[predicted]} ({(probs[predicted] * 100).toFixed(0)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilterHeatmaps({ weights }: { weights: CnnWeights }) {
  return (
    <div className={gridStyles.row}>
      <KernelHeatmap kernel={weights.kernels[0]} label="Learned filter 0" />
      <KernelHeatmap kernel={weights.kernels[1]} label="Learned filter 1" />
      <KernelHeatmap kernel={HAND_DESIGNED_KERNEL} label="Chapter 1's hand-designed kernel" />
    </div>
  );
}

/** Intuition beat: train the network and watch its loss drop as its two filters take shape. */
export function IntuitionDemo() {
  const { weights, epoch, train, reset } = useTraining();
  return (
    <>
      <FilterHeatmaps weights={weights} />
      <ClassificationRow weights={weights} />
      <div className={styles.controls}>
        <span>
          epoch {epoch} — loss = {meanLoss(weights).toFixed(4)}
        </span>
        <TrainResetButtons onTrain={train} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: same training loop — watch each example's predicted probability cross toward certainty. */
export function PlayDemo() {
  const { weights, epoch, train, reset } = useTraining();
  return (
    <>
      <ClassificationRow weights={weights} />
      <FilterHeatmaps weights={weights} />
      <div className={styles.controls}>
        <span>
          epoch {epoch} — loss = {meanLoss(weights).toFixed(4)}
        </span>
        <TrainResetButtons onTrain={train} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: train until the network's loss on the digit set drops below the target. */
export function CapstoneCheckpoint() {
  const { weights, epoch, train, reset } = useTraining();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const loss = meanLoss(weights);

  const passed = loss < TARGET_LOSS;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Train the network until its loss on the digit set drops below <strong>{TARGET_LOSS}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click train to try it"
    >
      <ClassificationRow weights={weights} />
      <FilterHeatmaps weights={weights} />
      <div className={styles.controls}>
        <span>
          epoch {epoch} — loss = {loss.toFixed(4)}
        </span>
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
