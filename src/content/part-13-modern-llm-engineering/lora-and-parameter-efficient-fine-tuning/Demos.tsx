"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TARGET_DELTA_W,
  fullFineTuneTrace,
  trainLora,
  loraLoss,
  outerProduct,
  LORA_START,
  FULL_FINE_TUNE_PARAM_COUNT,
  LORA_PARAM_COUNT,
} from "@/lib/math-core/lora-and-parameter-efficient-fine-tuning";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "lora-and-parameter-efficient-fine-tuning";
const STEP_OPTIONS = [1, 20, 100];
// Loss falls across ~30 orders of magnitude (1 step vs. 100 steps) as LoRA converges. A bar
// self-normalized to its own value is always full-length regardless of the number — comparing
// against the untrained starting loss instead makes the bar shrink as training actually progresses.
const STARTING_LOSS = loraLoss(LORA_START);

/** Intuition beat: step through LoRA's training and watch its low-rank approximation converge onto the target. */
export function IntuitionDemo() {
  const [steps, setSteps] = useState(20);
  const trace = trainLora(steps, 0.02, LORA_START);
  const final = trace[trace.length - 1];
  const approx = outerProduct(final.a, final.b);
  return (
    <>
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button key={n} type="button" className={n === steps ? styles.buttonActive : styles.button} onClick={() => setSteps(n)}>
            {n} steps
          </button>
        ))}
      </div>
      <KernelHeatmap kernel={approx} label="LoRA's rank-1 approximation of the target update" />
      <ContributionBars
        items={[{ label: "loss vs. start", value: loraLoss(final) }]}
        formatValue={(v) => v.toExponential(2)}
        max={STARTING_LOSS}
        readout={`${LORA_PARAM_COUNT} trainable parameters (2 length-4 vectors)`}
      />
    </>
  );
}

/** Play beat: the target update, the full fine-tune's result, and LoRA's — side by side. */
export function PlayDemo() {
  const fullFinal = fullFineTuneTrace(1, 0.5)[1];
  const loraFinal = trainLora(100, 0.02, LORA_START).at(-1)!;
  const loraApprox = outerProduct(loraFinal.a, loraFinal.b);
  return (
    <>
      <KernelHeatmap kernel={TARGET_DELTA_W} label="the target weight update" />
      <KernelHeatmap kernel={fullFinal} label={`full fine-tune, 1 step (${FULL_FINE_TUNE_PARAM_COUNT} params)`} />
      <KernelHeatmap kernel={loraApprox} label={`LoRA, 100 steps (${LORA_PARAM_COUNT} params)`} />
      <ContributionBars
        items={[
          { label: "full fine-tune loss", value: 0 },
          { label: "LoRA loss", value: loraLoss(loraFinal) },
        ]}
        formatValue={(v) => v.toExponential(2)}
        readout="half the parameters, essentially the same result — because the true update happens to be low-rank"
      />
    </>
  );
}

/** Checkpoint: find the step count where LoRA's loss has dropped below 1e-10. */
export function LoRACheckpoint() {
  const [steps, setSteps] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const loss = steps === null ? null : loraLoss(trainLora(steps, 0.02, LORA_START).at(-1)!);
  const passed = loss !== null && loss < 1e-10;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the step count, among the three candidates, where LoRA&apos;s loss has dropped below <strong>1e-10</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a step count to try it"
    >
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={n === steps ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setSteps(n);
            }}
          >
            {n} steps
          </button>
        ))}
      </div>
      {loss !== null && <ContributionBars items={[{ label: "loss", value: loss }]} formatValue={(v) => v.toExponential(2)} max={STARTING_LOSS} />}
    </CheckpointFrame>
  );
}
