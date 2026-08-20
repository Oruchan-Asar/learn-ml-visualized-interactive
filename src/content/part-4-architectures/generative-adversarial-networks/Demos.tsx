"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  REAL_VALUE,
  INITIAL_STATE,
  EPOCHS_PER_STEP,
  TARGET_GAP,
  discriminate,
  trainEpochs,
  confusionGap,
  type GanState,
} from "@/lib/math-core/gans";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "generative-adversarial-networks";
const CURVE_DOMAIN: [number, number] = [-2, 10];
const noop = () => {};

function useTraining() {
  const [state, setState] = useState<GanState>(INITIAL_STATE);
  const [epoch, setEpoch] = useState(0);

  const train = () => {
    setState((s) => trainEpochs(s, EPOCHS_PER_STEP));
    setEpoch((e) => e + EPOCHS_PER_STEP);
  };
  const reset = () => {
    setState(INITIAL_STATE);
    setEpoch(0);
  };

  return { state, epoch, train, reset };
}

function TrainResetButtons({ onTrain, onReset }: { onTrain: () => void; onReset: () => void }) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={styles.buttonPrimary} onClick={onTrain}>
        Train {EPOCHS_PER_STEP} steps
      </button>
      <button type="button" className={styles.button} onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

/** Intuition beat: click train — watch the generator's output (dot) chase the real value along the discriminator's curve. */
export function IntuitionDemo() {
  const { state, epoch, train, reset } = useTraining();
  const dReal = discriminate(state, REAL_VALUE);
  const dFake = discriminate(state, state.g);
  return (
    <>
      <CurvePlayground
        fn={(x) => discriminate(state, x)}
        derivative={(x) => {
          const d = discriminate(state, x);
          return d * (1 - d) * state.w;
        }}
        domain={CURVE_DOMAIN}
        value={state.g}
        onChange={noop}
        trail={[REAL_VALUE]}
        readout={`epoch ${epoch} — D(real=${REAL_VALUE}) = ${dReal.toFixed(3)}, D(fake=${state.g.toFixed(2)}) = ${dFake.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <TrainResetButtons onTrain={train} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: same training loop — watch the confusion gap (how well D still tells them apart) shrink, then wobble. */
export function PlayDemo() {
  const { state, epoch, train, reset } = useTraining();
  const gap = confusionGap(state);
  return (
    <>
      <CurvePlayground
        fn={(x) => discriminate(state, x)}
        derivative={(x) => {
          const d = discriminate(state, x);
          return d * (1 - d) * state.w;
        }}
        domain={CURVE_DOMAIN}
        value={state.g}
        onChange={noop}
        trail={[REAL_VALUE]}
        readout={`epoch ${epoch} — generator output = ${state.g.toFixed(2)}, confusion gap = ${gap.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <TrainResetButtons onTrain={train} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: train until the discriminator can no longer reliably tell the fake from the real value. */
export function GanCheckpoint() {
  const { state, epoch, train, reset } = useTraining();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const gap = confusionGap(state);

  const passed = gap < TARGET_GAP;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Train until the discriminator&rsquo;s confusion gap — |D(real) &minus; D(fake)| — drops below{" "}
          <strong>{TARGET_GAP}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click train to try it"
    >
      <CurvePlayground
        fn={(x) => discriminate(state, x)}
        derivative={(x) => {
          const d = discriminate(state, x);
          return d * (1 - d) * state.w;
        }}
        domain={CURVE_DOMAIN}
        value={state.g}
        onChange={noop}
        trail={[REAL_VALUE]}
        passed={passed}
        readout={`epoch ${epoch} — confusion gap = ${gap.toFixed(3)}`}
      />
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
