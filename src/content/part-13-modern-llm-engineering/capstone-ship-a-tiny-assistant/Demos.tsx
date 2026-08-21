"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { runAssistant, planServing, LORA_PARAM_COUNT, FULL_FINE_TUNE_PARAM_COUNT } from "@/lib/math-core/capstone-ship-a-tiny-assistant";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-ship-a-tiny-assistant";
const PROMPTS = ["double", "negate"] as const;

/** Intuition beat: one fine-tuned backbone, two different system prompts, two different answers. */
export function IntuitionDemo() {
  const [promptIndex, setPromptIndex] = useState(0);
  const prompt = PROMPTS[promptIndex];
  const result = runAssistant(prompt, 50, 100);
  return (
    <>
      <div className={styles.buttons}>
        {PROMPTS.map((p, i) => (
          <button key={p} type="button" className={i === promptIndex ? styles.buttonActive : styles.button} onClick={() => setPromptIndex(i)}>
            system prompt: {p}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "backbone loss (LoRA)", value: result.backboneLoss },
          { label: "answer", value: result.answer },
        ]}
        formatValue={(v) => (Math.abs(v) < 1e-10 ? v.toExponential(2) : v.toFixed(3))}
        readout={`backbone: ${LORA_PARAM_COUNT} trainable params, matches target (${result.backboneMatchesTarget ? "yes" : "no"})`}
      />
    </>
  );
}

/** Play beat: the whole pipeline's numbers, side by side — fine-tuning, prompting, and serving cost. */
export function PlayDemo() {
  const double = runAssistant("double", 50, 100);
  const negate = runAssistant("negate", 50, 100);
  const serving = planServing(50, 100);
  return (
    <>
      <ContributionBars
        items={[
          { label: "LoRA params", value: LORA_PARAM_COUNT },
          { label: "full fine-tune params", value: FULL_FINE_TUNE_PARAM_COUNT },
        ]}
        formatValue={(v) => v.toFixed(0)}
        readout={`same backbone quality, half the trainable parameters`}
      />
      <ContributionBars
        items={[
          { label: '"double" answer', value: double.answer },
          { label: '"negate" answer', value: negate.answer },
        ]}
        formatValue={(v) => v.toFixed(3)}
        readout="one backbone, two prompts, two behaviors — no retraining between them"
      />
      <ContributionBars
        items={[
          { label: "serving without cache", value: serving.totalWorkWithoutCache },
          { label: "serving with cache", value: serving.totalWorkWithCache },
        ]}
        formatValue={(v) => v.toFixed(0)}
        readout={`${serving.requests} requests × ${serving.tokensPerResponse} tokens: ${serving.speedup}x less total work`}
      />
    </>
  );
}

/** Checkpoint: find the system prompt that makes the assistant answer with a NEGATIVE number. */
export function ShipAssistantCheckpoint() {
  const [promptIndex, setPromptIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const result = promptIndex === null ? null : runAssistant(PROMPTS[promptIndex], 50, 100);
  const passed = result !== null && result.answer < 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the system prompt that makes the shipped assistant answer with a <strong>negative</strong> number.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a system prompt to try it"
    >
      <div className={styles.buttons}>
        {PROMPTS.map((p, i) => (
          <button
            key={p}
            type="button"
            className={i === promptIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setPromptIndex(i);
            }}
          >
            system prompt: {p}
          </button>
        ))}
      </div>
      {result && (
        <ContributionBars
          items={[{ label: "answer", value: result.answer }]}
          formatValue={(v) => v.toFixed(3)}
          max={Math.max(...PROMPTS.map((p) => Math.abs(runAssistant(p, 50, 100).answer)))}
        />
      )}
    </CheckpointFrame>
  );
}
