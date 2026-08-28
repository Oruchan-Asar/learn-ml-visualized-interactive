"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { happenedBefore, isConcurrent } from "@/lib/math-core/causality-and-happened-before";
import {
  TRACE,
  isTraceLinearizable,
  diagnoseViolation,
  isViolationMerelyConcurrent,
  findCausallyPriorWrite,
  findRealTimePriorWrite,
} from "@/lib/math-core/capstone-diagnose-a-consistency-violation";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "capstone-diagnose-a-consistency-violation";

function opLine(op: (typeof TRACE)[number]) {
  return `${op.id} [${op.client}] ${op.type} x ${op.type === "write" ? "= " + op.value : "→ " + op.value} (t=${op.start}–${op.end})  vc=[${op.vc.join(",")}]`;
}

/** Intuition beat: step through the 5-op trace, watching each op's vector clock grow across three clients. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const op = TRACE[i];

  return (
    <>
      <div className={styles.script}>{opLine(op)}</div>
      <ContributionBars
        items={[
          { label: "c0", value: op.vc[0] },
          { label: "c1", value: op.vc[1] },
          { label: "c2", value: op.vc[2] },
        ]}
        max={2}
        readout={`${op.id}'s vector clock`}
      />
      <div className={styles.buttons} style={{ marginTop: 10 }}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          ← Previous
        </button>
        <span className={styles.stepCount}>
          Step {i + 1} of {TRACE.length}
        </span>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(TRACE.length - 1, n + 1))}
          disabled={i === TRACE.length - 1}
        >
          Next →
        </button>
      </div>
    </>
  );
}

/** Play beat: pick any op and compare it against op3 directly, using the exact happened-before / concurrent checks from ch4. */
export function PlayDemo() {
  const [id, setId] = useState("op5");
  const op = TRACE.find((o) => o.id === id)!;
  const op3 = TRACE.find((o) => o.id === "op3")!;

  const before = id !== "op3" && happenedBefore(op3.vc, op.vc);
  const after = id !== "op3" && happenedBefore(op.vc, op3.vc);
  const concurrent = id !== "op3" && isConcurrent(op.vc, op3.vc);

  return (
    <>
      <div className={styles.buttons}>
        {TRACE.map((o) => (
          <button key={o.id} type="button" className={o.id === id ? styles.buttonPrimary : styles.button} onClick={() => setId(o.id)}>
            {o.id}
          </button>
        ))}
      </div>
      <div className={styles.script}>
        {opLine(op)}
        <br />
        {opLine(op3)}
        <br />
        {id === "op3"
          ? "same operation"
          : concurrent
            ? "concurrent with op3 — no message chain links them"
            : before
              ? "op3 happened-before this op"
              : after
                ? "this op happened-before op3"
                : "—"}
      </div>
    </>
  );
}

/** Checkpoint: click the single operation that breaks linearizability in this 3-replica trace. */
export function CapstoneCheckpoint() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const violator = diagnoseViolation(TRACE);
  const passed = selected !== null && selected === violator?.id;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const realTimePrior = violator ? findRealTimePriorWrite(TRACE, violator) : null;
  const causalPrior = violator ? findCausallyPriorWrite(TRACE, violator) : null;

  return (
    <CheckpointFrame
      instructions={
        <>
          isTraceLinearizable(TRACE) = {String(isTraceLinearizable(TRACE))}. Click the{" "}
          <strong>one operation</strong> that breaks it.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click the operation you think is the culprit"
    >
      <div className={styles.buttons}>
        {TRACE.map((o) => (
          <button
            key={o.id}
            type="button"
            className={o.id === selected ? styles.buttonPrimary : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setSelected(o.id);
            }}
          >
            {o.id}
          </button>
        ))}
      </div>
      <div className={styles.script}>
        {TRACE.map((o) => (
          <div key={o.id}>{opLine(o)}</div>
        ))}
      </div>
      {passed && violator && realTimePrior && causalPrior && (
        <div className={styles.script} style={{ marginTop: 8 }}>
          Correct — {violator.id} should have seen {realTimePrior.id}&apos;s write (finished at t={realTimePrior.end},
          before {violator.id} started at t={violator.start}), but it only causally knows about {causalPrior.id}.
          isViolationMerelyConcurrent({violator.id}, {realTimePrior.id}) ={" "}
          {String(isViolationMerelyConcurrent(violator, realTimePrior))} — a plain causal-consistency check would
          have missed this entirely.
        </div>
      )}
    </CheckpointFrame>
  );
}
