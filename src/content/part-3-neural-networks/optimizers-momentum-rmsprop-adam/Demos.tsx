"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  f,
  gradient,
  momentumStep,
  rmspropStep,
  adamStep,
  INITIAL_MOMENTUM_STATE,
  INITIAL_RMSPROP_STATE,
  INITIAL_ADAM_STATE,
  RACE_DOMAIN,
  TARGET_DISTANCE,
  distance,
} from "@/lib/math-core/optimizers";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "optimizers-momentum-rmsprop-adam";
const noop = () => {};

interface RacerBundle<T> {
  state: T;
  trail: { x: number; y: number }[];
}

function useRace() {
  const [mBundle, setMBundle] = useState<RacerBundle<typeof INITIAL_MOMENTUM_STATE>>({
    state: INITIAL_MOMENTUM_STATE,
    trail: [],
  });
  const [rBundle, setRBundle] = useState<RacerBundle<typeof INITIAL_RMSPROP_STATE>>({
    state: INITIAL_RMSPROP_STATE,
    trail: [],
  });
  const [aBundle, setABundle] = useState<RacerBundle<typeof INITIAL_ADAM_STATE>>({
    state: INITIAL_ADAM_STATE,
    trail: [],
  });
  const [stepCount, setStepCount] = useState(0);

  const step = () => {
    setMBundle((b) => ({ state: momentumStep(b.state), trail: [...b.trail, b.state.point] }));
    setRBundle((b) => ({ state: rmspropStep(b.state), trail: [...b.trail, b.state.point] }));
    setABundle((b) => ({ state: adamStep(b.state), trail: [...b.trail, b.state.point] }));
    setStepCount((n) => n + 1);
  };
  const reset = () => {
    setMBundle({ state: INITIAL_MOMENTUM_STATE, trail: [] });
    setRBundle({ state: INITIAL_RMSPROP_STATE, trail: [] });
    setABundle({ state: INITIAL_ADAM_STATE, trail: [] });
    setStepCount(0);
  };

  return {
    m: mBundle.state,
    r: rBundle.state,
    a: aBundle.state,
    mTrail: mBundle.trail,
    rTrail: rBundle.trail,
    aTrail: aBundle.trail,
    stepCount,
    step,
    reset,
  };
}

function StepResetButtons({ onStep, onReset }: { onStep: () => void; onReset: () => void }) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={styles.buttonPrimary} onClick={onStep}>
        Take a step
      </button>
      <button type="button" className={styles.button} onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

/** Intuition beat: all three race at once — orange is momentum, teal is RMSProp, grey is Adam. */
export function IntuitionDemo() {
  const { m, r, a, mTrail, rTrail, aTrail, stepCount, step, reset } = useRace();
  return (
    <>
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={RACE_DOMAIN}
        value={m.point}
        onChange={noop}
        trail={mTrail}
        extraSeries={[
          { point: r.point, trail: rTrail, colorClass: "accent2" },
          { point: a.point, trail: aTrail, colorClass: "ink" },
        ]}
        readout={`Step ${stepCount} — orange=momentum, teal=RMSProp, grey=Adam`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Play beat: same race, with each optimizer's distance to the target spelled out. */
export function PlayDemo() {
  const { m, r, a, mTrail, rTrail, aTrail, step, reset } = useRace();
  return (
    <>
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={RACE_DOMAIN}
        value={m.point}
        onChange={noop}
        trail={mTrail}
        extraSeries={[
          { point: r.point, trail: rTrail, colorClass: "accent2" },
          { point: a.point, trail: aTrail, colorClass: "ink" },
        ]}
        readout={`momentum=${distance(m.point).toFixed(2)}, RMSProp=${distance(r.point).toFixed(2)}, Adam=${distance(a.point).toFixed(2)}`}
      />
      <div className={styles.controls}>
        <StepResetButtons onStep={step} onReset={reset} />
      </div>
    </>
  );
}

/** Checkpoint: keep stepping until every optimizer has reached the target — the race isn't over until the slowest one arrives. */
export function OptimizersCheckpoint() {
  const { m, r, a, mTrail, rTrail, aTrail, stepCount, step, reset } = useRace();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed =
    distance(m.point) < TARGET_DISTANCE && distance(r.point) < TARGET_DISTANCE && distance(a.point) < TARGET_DISTANCE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Keep stepping until <strong>all three</strong> optimizers land within <strong>{TARGET_DISTANCE}</strong> of
          the target.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Take a step to try it"
    >
      <ContourPlayground
        fn={f}
        gradient={gradient}
        domain={RACE_DOMAIN}
        value={m.point}
        onChange={noop}
        trail={mTrail}
        extraSeries={[
          { point: r.point, trail: rTrail, colorClass: "accent2" },
          { point: a.point, trail: aTrail, colorClass: "ink" },
        ]}
        passed={passed}
        readout={`Step ${stepCount} — momentum=${distance(m.point).toFixed(2)}, RMSProp=${distance(r.point).toFixed(2)}, Adam=${distance(a.point).toFixed(2)}`}
      />
      <div className={styles.controls}>
        <StepResetButtons
          onStep={() => {
            setHasInteracted(true);
            step();
          }}
          onReset={reset}
        />
      </div>
    </CheckpointFrame>
  );
}
