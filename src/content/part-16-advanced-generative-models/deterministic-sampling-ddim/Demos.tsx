"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { X0, SCHEDULE_FULL, runSchedule, finalValue, TARGET_ERROR } from "@/lib/math-core/deterministic-sampling-ddim";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "deterministic-sampling-ddim";
const LAST_STEP = SCHEDULE_FULL.length - 1;

type Mode = "deterministic" | "stochastic";

function traceFor(mode: Mode) {
  return runSchedule(SCHEDULE_FULL, mode === "deterministic" ? 0 : 1);
}

function EtaSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>η = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: step through the same 4-step schedule, toggling between a deterministic (DDIM) path and
 * a stochastic (DDPM-style) one built from the exact same starting noise and predictor. */
export function IntuitionDemo() {
  const [mode, setMode] = useState<Mode>("deterministic");
  const [i, setI] = useState(0);
  const trace = traceFor(mode);
  const current = trace[i];
  const curve: CurveLine = {
    points: trace.slice(0, i + 1).map((entry, idx) => ({ x: idx, y: entry.value })),
    variant: "fitHighlight",
  };

  return (
    <>
      <div className={styles.buttons}>
        <button
          type="button"
          className={mode === "deterministic" ? styles.buttonActive : styles.button}
          onClick={() => {
            setMode("deterministic");
            setI(0);
          }}
        >
          Deterministic (DDIM)
        </button>
        <button
          type="button"
          className={mode === "stochastic" ? styles.buttonActive : styles.button}
          onClick={() => {
            setMode("stochastic");
            setI(0);
          }}
        >
          Stochastic (DDPM-style)
        </button>
      </div>
      <MultiCurvePlayground
        curves={[curve]}
        domain={[0, LAST_STEP]}
        rangeDomain={[2.5, 5.5]}
        scatterPoints={[{ x: i, y: current.value }]}
        readout={`step ${i}/${LAST_STEP} (t=${current.t}): x = ${current.value.toFixed(4)}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous step
        </button>
        <button
          type="button"
          className={styles.buttonActive}
          onClick={() => setI((n) => Math.min(LAST_STEP, n + 1))}
          disabled={i >= LAST_STEP}
        >
          Next step
        </button>
      </div>
    </>
  );
}

/** Play beat: drag eta from 0 (DDIM) to 1 (DDPM-style) and watch the same 4-step schedule's reconstruction
 * drift away from x0, purely from the noise injected along the way. */
export function PlayDemo() {
  const [eta, setEta] = useState(0.5);
  const trace = runSchedule(SCHEDULE_FULL, eta);
  const final = finalValue(trace);

  return (
    <>
      <ContributionBars
        items={trace.map((entry) => ({ label: `x (t=${entry.t})`, value: entry.value }))}
        formatValue={(v) => v.toFixed(3)}
        readout={`η = ${eta.toFixed(2)} → reconstructed x0 ≈ ${final.toFixed(3)} (true x0 = ${X0}), error = ${Math.abs(final - X0).toFixed(3)}`}
      />
      <div className={styles.controls}>
        <EtaSlider value={eta} onChange={setEta} />
      </div>
    </>
  );
}

/** Checkpoint: bring eta down until the reconstruction error drops below the target. */
export function DdimCheckpoint() {
  const [eta, setEta] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const trace = runSchedule(SCHEDULE_FULL, eta);
  const final = finalValue(trace);
  const error = Math.abs(final - X0);
  const passed = withinTolerance(error, 0, TARGET_ERROR);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Bring <strong>η</strong> down until the reconstructed x0 is within <strong>{TARGET_ERROR}</strong> of
          the true value, <strong>{X0}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag η to try it"
    >
      <ContributionBars
        items={[{ label: "reconstructed x0", value: final }]}
        formatValue={(v) => v.toFixed(3)}
        max={X0 + 1}
        readout={`error = ${error.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <EtaSlider
          value={eta}
          onChange={(v) => {
            setHasInteracted(true);
            setEta(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
