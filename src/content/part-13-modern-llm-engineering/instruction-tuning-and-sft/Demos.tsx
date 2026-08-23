"use client";

import { useEffect, useId, useState } from "react";
import { TokenChips } from "@/components/viz/TokenChips";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  PROMPT_TOKENS,
  RESPONSE_TOKENS,
  FULL_TOKENS,
  PROMPT_LENGTH,
  BASE_COMPLETION_TOKENS,
  SFT_COMPLETION_TOKENS,
  fullSequenceLoss,
  maskedLoss,
} from "@/lib/math-core/instruction-tuning-and-sft";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "instruction-tuning-and-sft";
const TARGET_LOSS = 0.9;
const TOLERANCE = 0.03;

/** Renders FULL_TOKENS, parenthesizing every token before `splitIndex` — the masked-out prompt that no longer votes in the loss. */
function MaskedTokens({ splitIndex }: { splitIndex: number }) {
  return <TokenChips tokens={FULL_TOKENS.map((tok, i) => (i < splitIndex ? `(${tok})` : tok))} />;
}

/** Intuition beat: slide the mask boundary and watch which tokens vote in the loss, and what the loss becomes. */
export function IntuitionDemo() {
  const [splitIndex, setSplitIndex] = useState(0);
  const id = useId();
  const loss = maskedLoss(splitIndex);

  return (
    <>
      <MaskedTokens splitIndex={splitIndex} />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label htmlFor={id}>mask boundary = {splitIndex}</label>
          <input
            id={id}
            type="range"
            min={0}
            max={FULL_TOKENS.length}
            step={1}
            value={splitIndex}
            onChange={(e) => setSplitIndex(Number(e.target.value))}
          />
        </div>
      </div>
      <p>
        {splitIndex === 0
          ? `no masking yet — every token votes, mean NLL = ${fullSequenceLoss().toFixed(4)} (this is pretraining's loss)`
          : splitIndex === PROMPT_LENGTH
            ? `boundary at ${PROMPT_LENGTH} — exactly where the prompt ends. Mean NLL over the response alone = ${loss.toFixed(4)} (this is SFT's loss)`
            : `mean NLL over the last ${FULL_TOKENS.length - splitIndex} tokens = ${loss.toFixed(4)}`}
      </p>
    </>
  );
}

/** Play beat: same prompt, two completions — the base model's document-continuation habit vs. the SFT model's actual answer. */
export function PlayDemo() {
  const [showTuned, setShowTuned] = useState(false);
  const completion = showTuned ? SFT_COMPLETION_TOKENS : BASE_COMPLETION_TOKENS;

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!showTuned ? styles.buttonActive : styles.button} onClick={() => setShowTuned(false)}>
          base model
        </button>
        <button type="button" className={showTuned ? styles.buttonActive : styles.button} onClick={() => setShowTuned(true)}>
          SFT-tuned model
        </button>
      </div>
      <TokenChips tokens={[...PROMPT_TOKENS, "→", ...completion]} />
      <p>
        {showTuned
          ? "the response Chapter's SFT tuning actually trained the model to produce"
          : 'same prompt, but the untuned base model just continues the "Explain X:" document pattern it saw during pretraining — it never learned to stop and answer'}
      </p>
    </>
  );
}

/** Checkpoint: find the mask boundary that reproduces SFT's actual loss, 0.9 — masking exactly the prompt, no more, no less. */
export function InstructionTuningCheckpoint() {
  const [splitIndex, setSplitIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const id = useId();

  const loss = maskedLoss(splitIndex);
  const passed = withinTolerance(loss, TARGET_LOSS, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the mask boundary until the masked loss lands on <strong>{TARGET_LOSS}</strong> — SFT&apos;s actual loss
          on this example, when the mask covers the prompt and nothing more.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <MaskedTokens splitIndex={splitIndex} />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label htmlFor={id}>mask boundary = {splitIndex}</label>
          <input
            id={id}
            type="range"
            min={0}
            max={FULL_TOKENS.length}
            step={1}
            value={splitIndex}
            onChange={(e) => {
              setHasInteracted(true);
              setSplitIndex(Number(e.target.value));
            }}
          />
        </div>
      </div>
      <p>masked loss = {loss.toFixed(4)}</p>
    </CheckpointFrame>
  );
}
