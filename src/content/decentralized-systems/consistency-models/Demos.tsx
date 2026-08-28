"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  HISTORY,
  isLinearizable,
  isSequentiallyConsistent,
  findViolatingOp,
  CAUSAL_WRITES,
  CAUSAL_VIEW_R1,
  CAUSAL_VIEW_R2,
  CAUSAL_VIEW_BAD,
  respectsCausalOrder,
  LWW_WRITES,
  applyLastWriterWins,
  convergesRegardlessOfOrder,
} from "@/lib/math-core/distributed-consistency-models";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "consistency-models";

function historyLine(op: (typeof HISTORY)[number]) {
  return `${op.id} [${op.client}] ${op.type} x ${op.type === "write" ? "= " + op.value : "→ " + op.value} (t=${op.start}–${op.end})`;
}

/** Intuition beat: step through the 5-op history and land on the one read that looks wrong. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const op = HISTORY[i];
  const isSuspicious = op.id === "op5";

  return (
    <>
      <div className={styles.script}>
        {historyLine(op)}
        {isSuspicious && (
          <>
            <br />
            op3 finished writing x=2 at t=7. This read starts at t=10 — well after — yet returns x=1.
            Something&apos;s off.
          </>
        )}
      </div>
      <div className={styles.buttons} style={{ marginTop: 10 }}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          ← Previous
        </button>
        <span className={styles.stepCount}>
          Step {i + 1} of {HISTORY.length}
        </span>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(HISTORY.length - 1, n + 1))}
          disabled={i === HISTORY.length - 1}
        >
          Next →
        </button>
      </div>
    </>
  );
}

type Model = "linearizable" | "sequential" | "causal" | "eventual";

/** Play beat: switch between the four models and watch each one's own checker run against its own scenario. */
export function PlayDemo() {
  const [model, setModel] = useState<Model>("linearizable");
  const [view, setView] = useState<"R1" | "R2" | "BAD">("R1");
  const [order, setOrder] = useState(LWW_WRITES);

  const views = { R1: CAUSAL_VIEW_R1, R2: CAUSAL_VIEW_R2, BAD: CAUSAL_VIEW_BAD };

  return (
    <>
      <div className={styles.buttons}>
        {(["linearizable", "sequential", "causal", "eventual"] as Model[]).map((m) => (
          <button key={m} type="button" className={m === model ? styles.buttonPrimary : styles.button} onClick={() => setModel(m)}>
            {m}
          </button>
        ))}
      </div>

      {(model === "linearizable" || model === "sequential") && (
        <div className={styles.script}>
          {HISTORY.map((op) => (
            <div key={op.id}>{historyLine(op)}</div>
          ))}
          <br />
          isLinearizable(HISTORY) = <strong>{String(isLinearizable(HISTORY))}</strong>
          <br />
          isSequentiallyConsistent(HISTORY) = <strong>{String(isSequentiallyConsistent(HISTORY))}</strong>
          {model === "sequential" && (
            <>
              <br />
              Dropping the real-time requirement is enough to make this same history valid.
            </>
          )}
        </div>
      )}

      {model === "causal" && (
        <>
          <div className={styles.buttons}>
            {(["R1", "R2", "BAD"] as const).map((v) => (
              <button key={v} type="button" className={v === view ? styles.buttonPrimary : styles.button} onClick={() => setView(v)}>
                view {v}
              </button>
            ))}
          </div>
          <div className={styles.script}>
            order: {views[view].join(" → ")}
            <br />
            respectsCausalOrder = <strong>{String(respectsCausalOrder(views[view], CAUSAL_WRITES))}</strong>
            {view === "BAD" && " — w2 applied before its own dependency w1."}
          </div>
        </>
      )}

      {model === "eventual" && (
        <div className={styles.script}>
          order: {order.map((w) => w.id).join(" → ")}
          <br />
          applyLastWriterWins = <strong>{applyLastWriterWins(order)}</strong>
          <br />
          convergesRegardlessOfOrder(LWW_WRITES) = <strong>{String(convergesRegardlessOfOrder(LWW_WRITES))}</strong>
          <div className={styles.buttons} style={{ marginTop: 8 }}>
            <button type="button" className={styles.button} onClick={() => setOrder((o) => [...o].reverse())}>
              Reverse delivery order
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Checkpoint: identify the strictest model that HISTORY still satisfies, given it fails linearizability. */
export function ConsistencyModelsCheckpoint() {
  const [choice, setChoice] = useState<Model | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = choice === "sequential";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const violator = findViolatingOp(HISTORY);

  return (
    <CheckpointFrame
      instructions={
        <>
          HISTORY fails linearizability ({violator?.id} is the culprit). Of the four models, which is the{" "}
          <strong>strictest one HISTORY still satisfies</strong>?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a model"
    >
      <div className={styles.buttons}>
        {(["linearizable", "sequential", "causal", "eventual"] as Model[]).map((m) => (
          <button
            key={m}
            type="button"
            className={m === choice ? styles.buttonPrimary : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChoice(m);
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <div className={styles.script}>
        isLinearizable(HISTORY) = {String(isLinearizable(HISTORY))}, isSequentiallyConsistent(HISTORY) ={" "}
        {String(isSequentiallyConsistent(HISTORY))}
      </div>
    </CheckpointFrame>
  );
}
