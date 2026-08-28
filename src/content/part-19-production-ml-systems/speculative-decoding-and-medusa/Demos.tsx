"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TARGET_SEQUENCE,
  DRAFT_ROUNDS,
  runRound,
  simulateSession,
  tokensPerCall,
  BASELINE_TOKENS_PER_CALL,
  CHECKPOINT_REMAINING,
  CHECKPOINT_GUESSES,
  CHECKPOINT_CANDIDATES,
} from "@/lib/math-core/speculative-decoding-and-medusa";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "speculative-decoding-and-medusa";
const SESSION = simulateSession();

/** Reconstructs, for each round, the still-remaining target tokens the big model has to verify against. */
function remainingBefore(roundIndex: number): string[] {
  const emittedSoFar = SESSION.rounds.slice(0, roundIndex).reduce((sum, r) => sum + r.emitted.length, 0);
  return TARGET_SEQUENCE.slice(emittedSoFar);
}

/** Intuition beat: step through each round of speculative decoding — draft guesses, accepted prefix, bonus token. */
export function IntuitionDemo() {
  const [step, setStep] = useState(0);
  const numRounds = DRAFT_ROUNDS.length;
  const guesses = DRAFT_ROUNDS[step];
  const remaining = remainingBefore(step);
  const round = runRound(remaining, guesses);
  const hasBonus = round.accepted < round.emitted.length;

  return (
    <>
      <p>
        Still-remaining target: <strong>{remaining.join(" ")}</strong>
      </p>
      <p>
        Draft model guesses: {guesses.map((g, i) => (
          <span key={i} style={{ color: i < round.accepted ? "var(--accent2-ink)" : "var(--ink-faint)" }}>
            {g}{i < guesses.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
      <p>
        Big model verifies in one pass: accepts {round.accepted} of {guesses.length}
        {hasBonus ? ", plus one bonus token" : ""} — emits <strong>{round.emitted.join(" ")}</strong>
      </p>
      <div className={styles.controls}>
        <span className={styles.stepCount}>
          round {step + 1} of {numRounds}
        </span>
      </div>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          ← prev round
        </button>
        <button type="button" className={styles.button} disabled={step === numRounds - 1} onClick={() => setStep((s) => Math.min(numRounds - 1, s + 1))}>
          next round →
        </button>
      </div>
    </>
  );
}

/** Play beat: the full session's throughput against the one-token-per-call autoregressive baseline. */
export function PlayDemo() {
  return (
    <>
      <ContributionBars
        items={[
          { label: "autoregressive (baseline)", value: BASELINE_TOKENS_PER_CALL },
          { label: "speculative decoding", value: tokensPerCall(SESSION) },
        ]}
        formatValue={(v) => v.toFixed(2)}
        max={3}
        readout={`${SESSION.totalTokens} tokens emitted in ${SESSION.totalCalls} big-model calls — ${tokensPerCall(SESSION).toFixed(2)} tokens/call, versus 1 for standard decoding`}
      />
    </>
  );
}

/** Checkpoint: an unseen round — how many tokens get emitted, guesses plus any bonus? */
export function SpeculativeDecodingCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const result = runRound(CHECKPOINT_REMAINING, CHECKPOINT_GUESSES);
  const target = result.emitted.length;
  const passed = chosen === target;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Remaining target: <strong>{CHECKPOINT_REMAINING.join(" ")}</strong>. Draft guesses:{" "}
          <strong>{CHECKPOINT_GUESSES.join(", ")}</strong>. Including any bonus token, how many tokens does
          this round emit?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <div className={styles.buttons}>
        {CHECKPOINT_CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
