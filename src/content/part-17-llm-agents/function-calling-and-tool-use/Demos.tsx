"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { QUERIES, trueAnswer, guessError, respond } from "@/lib/math-core/function-calling-and-tool-use";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "function-calling-and-tool-use";
const QUERY_LABELS = QUERIES.map((q) => `${q.a} × ${q.b}`);

/** Intuition beat: toggle tool access for one query and watch the response switch from a guess to an exact call. */
export function IntuitionDemo() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [toolAvailable, setToolAvailable] = useState(false);
  const q = QUERIES[queryIndex];
  const response = respond(q, toolAvailable);

  return (
    <>
      <div className={styles.buttons}>
        {QUERY_LABELS.map((label, i) => (
          <button key={label} type="button" className={i === queryIndex ? styles.buttonActive : styles.button} onClick={() => setQueryIndex(i)}>
            {label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: response.type === "tool_call" ? "calculator(a, b)" : "free-text guess", value: response.value },
          { label: "true answer", value: trueAnswer(q) },
        ]}
        formatValue={(v) => v.toFixed(0)}
        readout={toolAvailable ? "tool available → structured call, exact" : "no tool → free-text guess, approximate"}
      />
      <div className={styles.buttons}>
        <button type="button" className={!toolAvailable ? styles.buttonActive : styles.button} onClick={() => setToolAvailable(false)}>
          No tool
        </button>
        <button type="button" className={toolAvailable ? styles.buttonActive : styles.button} onClick={() => setToolAvailable(true)}>
          Calculator available
        </button>
      </div>
    </>
  );
}

/** Play beat: every query's guess error, without a tool — how far pattern-matched arithmetic drifts from the exact answer. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={QUERY_LABELS.map((label, i) => ({ label, value: guessError(QUERIES[i]) }))}
      formatValue={(v) => v.toFixed(0)}
      readout="every one of these errors drops to exactly zero the moment a calculator tool is available"
    />
  );
}

/** Checkpoint: find the query, among the three, with the LARGEST guess error when no tool is available. */
export function ToolUseCheckpoint() {
  const [queryIndex, setQueryIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const errors = QUERIES.map(guessError);
  const maxError = Math.max(...errors);
  const chosenError = queryIndex === null ? null : errors[queryIndex];
  const passed = chosenError !== null && chosenError === maxError;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the query, among the three, with the <strong>largest</strong> guess error when no tool is available.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a query to try it"
    >
      <div className={styles.buttons}>
        {QUERY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={i === queryIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setQueryIndex(i);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {chosenError !== null && <ContributionBars items={[{ label: "guess error", value: chosenError }]} formatValue={(v) => v.toFixed(0)} max={maxError} />}
    </CheckpointFrame>
  );
}
