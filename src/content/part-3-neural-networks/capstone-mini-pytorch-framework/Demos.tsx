"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  XOR_POINTS,
  XOR_DOMAIN,
  EPOCHS_PER_STEP,
  TARGET_LOSS,
  initialAdamWState,
  forward,
  meanLoss,
  trainEpochs,
  type AdamWState,
} from "@/lib/math-core/capstone-mini-pytorch-framework";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-mini-pytorch-framework";
const PROBE = { x: 0.5, y: 0.5 };
const noop = () => {};
const GRAD_EPS = 1e-3;

function useTraining() {
  const [state, setState] = useState<AdamWState>(initialAdamWState);

  const train = () => setState((s) => trainEpochs(s, EPOCHS_PER_STEP));
  const reset = () => setState(initialAdamWState());

  return { state, train, reset };
}

function makeFieldFns(state: AdamWState) {
  const fn = (x: number, y: number) => forward(state.weights, x, y).output;
  const gradient = (x: number, y: number) => ({
    x: (fn(x + GRAD_EPS, y) - fn(x - GRAD_EPS, y)) / (2 * GRAD_EPS),
    y: (fn(x, y + GRAD_EPS) - fn(x, y - GRAD_EPS)) / (2 * GRAD_EPS),
  });
  return { fn, gradient };
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

/** Intuition beat: click train, watch the framework's own loop — forward, loss, backward, AdamW step — fold the boundary around XOR. */
export function IntuitionDemo() {
  const { state, train, reset } = useTraining();
  const { fn, gradient } = makeFieldFns(state);
  return (
    <>
      <ContourPlayground
        fn={fn}
        gradient={gradient}
        domain={XOR_DOMAIN}
        value={PROBE}
        onChange={noop}
        labeledPoints={XOR_POINTS}
        readout={`epoch ${state.t} — loss = ${meanLoss(state.weights).toFixed(4)}`}
      />
      <div className={styles.controls}>
        <TrainResetButtons onTrain={train} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: same loop — watch each corner's individual output cross toward its true label, driven by AdamW's per-parameter update. */
export function PlayDemo() {
  const { state, train, reset } = useTraining();
  const { fn, gradient } = makeFieldFns(state);
  const outputs = XOR_POINTS.map((p) => forward(state.weights, p.x, p.y).output);
  return (
    <>
      <ContourPlayground
        fn={fn}
        gradient={gradient}
        domain={XOR_DOMAIN}
        value={PROBE}
        onChange={noop}
        labeledPoints={XOR_POINTS}
        readout={`epoch ${state.t} — outputs: (0,0)=${outputs[0].toFixed(2)}, (0,1)=${outputs[1].toFixed(2)}, (1,0)=${outputs[2].toFixed(2)}, (1,1)=${outputs[3].toFixed(2)}`}
      />
      <div className={styles.controls}>
        <TrainResetButtons onTrain={train} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: train with AdamW until the network's loss on XOR drops below the target. */
export function CapstoneCheckpoint() {
  const { state, train, reset } = useTraining();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const { fn, gradient } = makeFieldFns(state);
  const loss = meanLoss(state.weights);

  const passed = loss < TARGET_LOSS;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Train the network until its loss on XOR drops below <strong>{TARGET_LOSS}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click train to try it"
    >
      <ContourPlayground
        fn={fn}
        gradient={gradient}
        domain={XOR_DOMAIN}
        value={PROBE}
        onChange={noop}
        labeledPoints={XOR_POINTS}
        passed={passed}
        readout={`epoch ${state.t} — loss = ${loss.toFixed(4)}`}
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
