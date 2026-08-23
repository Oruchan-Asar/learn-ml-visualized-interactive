"use client";

import { useEffect, useId, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  START,
  TARGET,
  SIM_FRICTION,
  REAL_FRICTION,
  SIM_GAIN,
  STEPS,
  SUCCESS_TOLERANCE,
  finalError,
  finalPosition,
  succeeds,
} from "@/lib/math-core/sim-to-real-transfer-and-physics-engines";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import srStyles from "./SimReal.module.css";

const CONCEPT_ID = "sim-to-real-transfer-and-physics-engines";
const DOMAIN: [number, number] = [-1, 5];

function ArmReadout({ gain, friction }: { gain: number; friction: number }) {
  const pos = finalPosition(gain, friction, STEPS);
  const error = finalError(gain, friction, STEPS);
  const ok = succeeds(gain, friction);
  return (
    <>
      <VectorPlayground vectors={[{ x: pos, y: 0 }]} cloudPoints={[{ x: TARGET, y: 0 }]} domain={DOMAIN} size={220} />
      <div className={srStyles.readout}>
        <p>
          After {STEPS} control steps: position {pos.toFixed(3)}, target {TARGET}, error {error.toFixed(3)}
        </p>
        <p className={ok ? srStyles.ok : srStyles.alert}>
          {ok ? `Success — within ${SUCCESS_TOLERANCE} of the target` : `Failure — outside ${SUCCESS_TOLERANCE} of the target`}
        </p>
      </div>
    </>
  );
}

/** Intuition beat: toggle sim vs. real friction on the exact same gain, and watch the same policy stop reaching the target. */
export function IntuitionDemo() {
  const [mode, setMode] = useState<"sim" | "real">("sim");
  const friction = mode === "sim" ? SIM_FRICTION : REAL_FRICTION;

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={mode === "sim" ? styles.buttonActive : styles.button} onClick={() => setMode("sim")}>
          sim (friction {SIM_FRICTION})
        </button>
        <button type="button" className={mode === "real" ? styles.buttonActive : styles.button} onClick={() => setMode("real")}>
          real (friction {REAL_FRICTION})
        </button>
      </div>
      <ArmReadout gain={SIM_GAIN} friction={friction} />
    </>
  );
}

/** Play beat: sim and real side by side, same gain, same step budget. */
export function PlayDemo() {
  const rows = [
    { label: "sim", friction: SIM_FRICTION },
    { label: "real", friction: REAL_FRICTION },
  ];
  return (
    <div className={srStyles.table}>
      <div className={srStyles.row}>
        <span className={srStyles.rowHeader}>environment</span>
        <span className={srStyles.rowHeader}>final position</span>
        <span className={srStyles.rowHeader}>error</span>
        <span className={srStyles.rowHeader}>result</span>
      </div>
      {rows.map((r) => {
        const ok = succeeds(SIM_GAIN, r.friction);
        return (
          <div className={srStyles.row} key={r.label}>
            <span>{r.label}</span>
            <span>{finalPosition(SIM_GAIN, r.friction, STEPS).toFixed(4)}</span>
            <span>{finalError(SIM_GAIN, r.friction, STEPS).toFixed(4)}</span>
            <span className={ok ? srStyles.ok : srStyles.alert}>{ok ? "success" : "failure"}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Checkpoint: find a gain that closes the reality gap — succeeds under real friction within the same step budget. */
export function SimRealCheckpoint() {
  const [gain, setGain] = useState(SIM_GAIN);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const id = useId();

  const passed = succeeds(gain, REAL_FRICTION);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          The gain {SIM_GAIN} was tuned in sim and fails on the real robot (friction {REAL_FRICTION}). Find a gain
          that still reaches the target within tolerance, under real friction, in the same {STEPS} steps.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the slider to try it"
    >
      <div className={styles.sliderRow}>
        <label htmlFor={id}>gain K = {gain.toFixed(2)}</label>
        <input
          id={id}
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={gain}
          onChange={(e) => {
            setHasInteracted(true);
            setGain(Number(e.target.value));
          }}
        />
      </div>
      <ArmReadout gain={gain} friction={REAL_FRICTION} />
    </CheckpointFrame>
  );
}
