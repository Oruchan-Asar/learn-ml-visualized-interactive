"use client";

import { useEffect, useId, useState } from "react";
import { TokenChips } from "@/components/viz/TokenChips";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { MERGES, NUM_MERGES, END_OF_WORD, tokenizeAtStep, encode } from "@/lib/math-core/tokenization";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import localStyles from "./Tokenization.module.css";

const CONCEPT_ID = "tokenization";
const DEMO_WORD = "newest";

function StepSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>merge step = {value}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={NUM_MERGES}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function sanitize(input: string): string {
  return input.toLowerCase().replace(/[^a-z]/g, "");
}

/** Intuition beat: watch "newest" get cut into fewer, larger pieces as merge rules are applied one at a time. */
export function IntuitionDemo() {
  const [step, setStep] = useState(0);
  const tokens = tokenizeAtStep(DEMO_WORD, step);
  const rule = step > 0 ? MERGES[step - 1] : null;
  return (
    <>
      <TokenChips tokens={tokens} />
      <div className={styles.controls}>
        <StepSlider value={step} onChange={setStep} />
      </div>
      <p className={localStyles.note}>
        {rule
          ? `merge ${step}: "${rule.pair[0]}" + "${rule.pair[1]}" → "${rule.merged}" (seen together ${rule.count} times)`
          : `"${DEMO_WORD}" split into individual characters — no merges applied yet`}
      </p>
    </>
  );
}

/** Play beat: type any word — see it cut into the same subword pieces learned from a completely different set of words. */
export function PlayDemo() {
  const [input, setInput] = useState("lowest");
  const word = sanitize(input);
  const { tokens, ids } = encode(word || "");
  return (
    <>
      <TokenChips tokens={tokens} ids={ids} />
      <div className={styles.controls}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type a word (letters l,o,w,e,r,n,s,t,i,d work best)"
          className={localStyles.input}
        />
      </div>
    </>
  );
}

/** Checkpoint: find a word that reuses a real merged subword — not just its own individual letters. */
export function TokenizationCheckpoint() {
  const [input, setInput] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const word = sanitize(input);
  const { tokens, ids } = encode(word || "");
  const passed = tokens.some((t) => t !== END_OF_WORD && t.length > 1);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Type a word (using letters l, o, w, e, r, n, s, t, i, d) that gets cut using at least one{" "}
          <strong>merged subword</strong> — a piece bigger than a single character.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Type a word to try it"
    >
      <TokenChips tokens={tokens} ids={ids} />
      <div className={styles.controls}>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setHasInteracted(true);
            setInput(e.target.value);
          }}
          placeholder="type a word"
          className={localStyles.input}
        />
      </div>
    </CheckpointFrame>
  );
}
