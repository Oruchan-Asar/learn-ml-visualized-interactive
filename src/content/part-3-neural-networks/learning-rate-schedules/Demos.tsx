"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  constantLR,
  stepDecayLR,
  warmupCosineLR,
  trajectory,
  loss,
  maxLoss,
  X0,
  TOTAL_STEPS,
  TARGET_LOSS,
  OVERSHOOT_TOLERANCE,
  type ScheduleFn,
} from "@/lib/math-core/learning-rate-schedules";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "learning-rate-schedules";
const LOG_DOMAIN: [number, number] = [-7, 6];

interface SchedulePreset {
  key: string;
  label: string;
  fn: ScheduleFn;
}

const PRESETS: SchedulePreset[] = [
  { key: "constant", label: "Constant", fn: constantLR },
  { key: "step", label: "Step decay", fn: stepDecayLR },
  { key: "warmup", label: "Warmup + cosine", fn: warmupCosineLR },
];

function toLog(v: number): number {
  return Math.log10(Math.max(v, 1e-7));
}

function curvesFor(selectedKey: string): CurveLine[] {
  return PRESETS.map((p) => {
    const xs = trajectory(p.fn, TOTAL_STEPS);
    return {
      points: xs.map((x, i) => ({ x: i, y: toLog(loss(x)) })),
      variant: p.key === selectedKey ? "fitHighlight" : "fit",
    } as CurveLine;
  });
}

function PresetButtons({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  return (
    <div className={styles.buttons}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          className={p.key === selected ? styles.buttonActive : styles.button}
          onClick={() => onSelect(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/** Intuition beat: start on "constant" — the too-large base rate never gets reduced, so log(loss) climbs the whole way. */
export function IntuitionDemo() {
  const [selected, setSelected] = useState("constant");
  const preset = PRESETS.find((p) => p.key === selected)!;
  const finalLoss = loss(trajectory(preset.fn, TOTAL_STEPS)[TOTAL_STEPS]);
  return (
    <>
      <MultiCurvePlayground
        curves={curvesFor(selected)}
        domain={[0, TOTAL_STEPS]}
        rangeDomain={LOG_DOMAIN}
        readout={`${preset.label} — log₁₀(loss) after ${TOTAL_STEPS} steps ≈ ${toLog(finalLoss).toFixed(2)} (loss ≈ ${finalLoss.toExponential(2)})`}
      />
      <div className={styles.controls}>
        <PresetButtons selected={selected} onSelect={setSelected} />
      </div>
    </>
  );
}

/** Play beat: switch between all three — step decay eventually recovers too, but only after a huge mid-trajectory overshoot. */
export function PlayDemo() {
  const [selected, setSelected] = useState("warmup");
  const preset = PRESETS.find((p) => p.key === selected)!;
  const xs = trajectory(preset.fn, TOTAL_STEPS);
  const finalLoss = loss(xs[TOTAL_STEPS]);
  const peakLoss = maxLoss(xs);
  return (
    <>
      <MultiCurvePlayground
        curves={curvesFor(selected)}
        domain={[0, TOTAL_STEPS]}
        rangeDomain={LOG_DOMAIN}
        readout={`final loss ≈ ${finalLoss.toExponential(2)} — peak loss along the way ≈ ${peakLoss.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <PresetButtons selected={selected} onSelect={setSelected} />
      </div>
    </>
  );
}

/** Checkpoint: pick the one schedule that both converges under the target loss and never overshoots its own starting loss. */
export function LearningRateScheduleCheckpoint() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const preset = PRESETS.find((p) => p.key === selected);
  const xs = preset ? trajectory(preset.fn, TOTAL_STEPS) : null;
  const finalLoss = xs ? loss(xs[TOTAL_STEPS]) : Infinity;
  const peakLoss = xs ? maxLoss(xs) : Infinity;
  const startingLoss = loss(X0);
  const passed = Boolean(preset) && finalLoss < TARGET_LOSS && peakLoss <= startingLoss * OVERSHOOT_TOLERANCE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick the schedule that gets the loss under <strong>{TARGET_LOSS}</strong> by step {TOTAL_STEPS}{" "}
          <strong>and</strong> never lets the loss climb above its own starting value along the way.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a schedule to try it"
    >
      <MultiCurvePlayground
        curves={curvesFor(selected ?? "")}
        domain={[0, TOTAL_STEPS]}
        rangeDomain={LOG_DOMAIN}
        readout={
          preset
            ? `${preset.label} — final loss ${finalLoss.toExponential(2)}, peak loss ${peakLoss.toExponential(2)}`
            : "no schedule selected yet"
        }
      />
      <div className={styles.controls}>
        <PresetButtons
          selected={selected ?? ""}
          onSelect={(key) => {
            setHasInteracted(true);
            setSelected(key);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
