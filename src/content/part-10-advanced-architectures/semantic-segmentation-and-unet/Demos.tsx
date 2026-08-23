"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  INPUT,
  SKIP1,
  BOTTLENECK,
  upsample2x,
  decodeWithoutSkip,
  decodeWithSkip,
  reconstructionErrorWithoutSkip,
  reconstructionErrorWithSkip,
} from "@/lib/math-core/semantic-segmentation-and-unet";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "semantic-segmentation-and-unet";
const ERROR_TARGET = 10;

const STAGES = [
  { label: "input (4x4)", grid: () => INPUT },
  { label: "encoder pool -> skip (2x2)", grid: () => SKIP1 },
  { label: "bottleneck (1x1)", grid: () => BOTTLENECK },
  { label: "upsample only, no skip (2x2)", grid: () => upsample2x(BOTTLENECK) },
  { label: "final decode without skip (4x4)", grid: () => decodeWithoutSkip() },
];

/** Intuition beat: step through the encoder -> bottleneck -> decoder trace, watching detail disappear. */
export function IntuitionDemo() {
  const [step, setStep] = useState(0);
  const stage = STAGES[step];
  return (
    <>
      <div className={styles.buttons}>
        {STAGES.map((s, i) => (
          <button key={s.label} type="button" className={i === step ? styles.buttonActive : styles.button} onClick={() => setStep(i)}>
            step {i + 1}
          </button>
        ))}
      </div>
      <KernelHeatmap kernel={stage.grid()} label={stage.label} />
      <p>{step < 2 ? "Encoding: each pool keeps only the block maximum, throwing the rest away." : step === 2 ? "The bottleneck: one number stands in for all 16 original pixels." : "Decoding without any skip connection: upsampling can only repeat that one number back out."}</p>
    </>
  );
}

/** Play beat: the same decode, now with skip connections turned on, compared against the no-skip reconstruction. */
export function PlayDemo() {
  const withoutSkip = decodeWithoutSkip();
  const withSkip = decodeWithSkip();
  const errWithout = reconstructionErrorWithoutSkip();
  const errWith = reconstructionErrorWithSkip();
  return (
    <>
      <KernelHeatmap kernel={INPUT} label="original input (4x4)" />
      <KernelHeatmap kernel={withoutSkip} label="decoded without skip connections" />
      <KernelHeatmap kernel={withSkip} label="decoded with skip connections" />
      <ContributionBars
        items={[
          { label: "MSE without skip", value: errWithout },
          { label: "MSE with skip", value: errWith },
        ]}
        formatValue={(v) => v.toFixed(3)}
        readout={`skip connections cut reconstruction error by ${(errWithout / errWith).toFixed(2)}x on this scene`}
      />
    </>
  );
}

/** Checkpoint: toggle skip connections on and confirm reconstruction error drops below the target. */
export function UNetCheckpoint() {
  const [useSkip, setUseSkip] = useState<boolean | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const error = useSkip === null ? null : useSkip ? reconstructionErrorWithSkip() : reconstructionErrorWithoutSkip();
  const passed = error !== null && error < ERROR_TARGET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Toggle the decoder until reconstruction error drops <strong>below {ERROR_TARGET}</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a decoder mode to try it"
    >
      <div className={styles.buttons}>
        <button
          type="button"
          className={useSkip === false ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setUseSkip(false);
          }}
        >
          without skip connections
        </button>
        <button
          type="button"
          className={useSkip === true ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setUseSkip(true);
          }}
        >
          with skip connections
        </button>
      </div>
      {error !== null && <ContributionBars items={[{ label: "reconstruction MSE", value: error }]} formatValue={(v) => v.toFixed(3)} />}
    </CheckpointFrame>
  );
}
