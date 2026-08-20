"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TOKENS,
  FULL_SELF_ATTENTION_MATRIX,
  HEAD_A_MATRIX,
  HEAD_B_MATRIX,
  HEAD_A_LABEL,
  HEAD_B_LABEL,
  MOST_DISAGREEING_TOKEN,
  headDisagreement,
} from "@/lib/math-core/self-attention-multi-head";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "self-attention-and-multi-head-attention";
const ORDER = TOKENS.map((t) => t.label).join(", ");

function TokenButtons({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  return (
    <div className={styles.buttons}>
      {TOKENS.map((t, i) => (
        <button
          key={t.label}
          type="button"
          className={i === value ? styles.buttonActive : styles.button}
          onClick={() => onChange(i)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Intuition beat: self-attention — every token queries every token, including itself. */
export function IntuitionDemo() {
  return (
    <>
      <KernelHeatmap kernel={FULL_SELF_ATTENTION_MATRIX} label={`self-attention (rows = query, cols = key: ${ORDER})`} width={200} />
      <p className={styles.controls}>
        Row {'"sat"'} is exactly uniform — it sits equally close to both {'"the"'} and {'"cat"'}, so it has no reason
        to favor either.
      </p>
    </>
  );
}

/** Play beat: two heads, two different projections of the same tokens — click through queries and watch them disagree. */
export function PlayDemo() {
  const [query, setQuery] = useState(2);
  const disagreement = headDisagreement(query);
  return (
    <>
      <div className={styles.buttons}>
        <KernelHeatmap kernel={HEAD_A_MATRIX} label={HEAD_A_LABEL} width={180} />
        <KernelHeatmap kernel={HEAD_B_MATRIX} label={HEAD_B_LABEL} width={180} />
      </div>
      <div className={styles.controls}>
        <TokenButtons value={query} onChange={setQuery} />
      </div>
      <p className={styles.controls}>
        {`query = "${TOKENS[query].label}" — Head A row: [${HEAD_A_MATRIX[query].map((w) => w.toFixed(2)).join(", ")}], Head B row: [${HEAD_B_MATRIX[query].map((w) => w.toFixed(2)).join(", ")}] — disagreement = ${disagreement.toFixed(3)}`}
      </p>
    </>
  );
}

/** Checkpoint: click the query token where the two heads point in the most different directions. */
export function SelfAttentionCheckpoint() {
  const [guess, setGuess] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = guess !== null && TOKENS[guess].label === MOST_DISAGREEING_TOKEN;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Click the token where Head A and Head B disagree the most about where to look.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a token to try it"
    >
      <div className={styles.buttons}>
        <KernelHeatmap kernel={HEAD_A_MATRIX} label={HEAD_A_LABEL} width={180} />
        <KernelHeatmap kernel={HEAD_B_MATRIX} label={HEAD_B_LABEL} width={180} />
      </div>
      <div className={styles.controls}>
        <TokenButtons
          value={guess ?? -1}
          onChange={(i) => {
            setHasInteracted(true);
            setGuess(i);
          }}
        />
      </div>
      {guess !== null && (
        <p className={styles.controls}>
          {`disagreement for "${TOKENS[guess].label}" = ${headDisagreement(guess).toFixed(3)}`}
        </p>
      )}
    </CheckpointFrame>
  );
}
