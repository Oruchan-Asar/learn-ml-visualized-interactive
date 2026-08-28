"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  MESSAGES,
  ROUND_LOGS,
  messageDelay,
  isSynchronousUnderBound,
  minimumSynchronousBound,
  classifyFailure,
  type FailureMode,
} from "@/lib/math-core/distributed-system-models-and-failure-modes";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "distributed-system-models-and-failure-modes";

function DeltaSlider({ delta, onChange }: { delta: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }} className={styles.stepCount}>
      Δ (bound) = {delta}
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={delta}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "var(--accent)", width: 160 }}
      />
    </label>
  );
}

function MessageList({ delta }: { delta: number }) {
  return (
    <div className={styles.script}>
      {MESSAGES.map((m) => {
        const d = messageDelay(m)!;
        const within = d <= delta;
        return (
          <div key={m.id} style={{ marginBottom: 4 }}>
            {m.from} → {m.to}: delay {d} — {within ? "✓ within Δ" : "✗ exceeds Δ"}
          </div>
        );
      })}
    </div>
  );
}

/** Intuition beat: drag Δ and watch which messages start to violate the bound, with no formula yet. */
export function IntuitionDemo() {
  const [delta, setDelta] = useState(5);
  const synchronous = isSynchronousUnderBound(MESSAGES, delta);

  return (
    <>
      <MessageList delta={delta} />
      <DeltaSlider delta={delta} onChange={setDelta} />
      <div className={styles.stepCount} style={{ marginTop: 8 }}>
        {synchronous
          ? "Every message arrives within Δ — this round is synchronous under this bound."
          : "At least one message exceeds Δ — under this bound, you can only assume the asynchronous model."}
      </div>
    </>
  );
}

/** Play beat: same slider, now reading off the exact minimum bound that makes the round synchronous. */
export function PlayDemo() {
  const [delta, setDelta] = useState(5);
  const [nodeIndex, setNodeIndex] = useState(0);
  const synchronous = isSynchronousUnderBound(MESSAGES, delta);
  const minBound = minimumSynchronousBound(MESSAGES)!;

  const log = ROUND_LOGS[nodeIndex];
  const verdict: FailureMode = classifyFailure(log);

  return (
    <>
      <MessageList delta={delta} />
      <DeltaSlider delta={delta} onChange={setDelta} />
      <div className={styles.stepCount} style={{ marginTop: 8 }}>
        isSynchronousUnderBound(Δ={delta}) = {String(synchronous)} — the minimum working bound is Δ_min = {minBound}.
      </div>

      <div className={styles.buttons} style={{ marginTop: 14 }}>
        {ROUND_LOGS.map((l, i) => (
          <button
            key={l.node}
            type="button"
            className={i === nodeIndex ? styles.buttonPrimary : styles.button}
            onClick={() => setNodeIndex(i)}
          >
            Node {l.node}
          </button>
        ))}
      </div>
      <div className={styles.script}>
        {log.node} expected to send: {Object.entries(log.expected).map(([p, v]) => `${p}=${v}`).join(", ")}
        <br />
        {log.node} actually sent: {Object.keys(log.actual).length === 0
          ? "nothing"
          : Object.entries(log.actual).map(([p, v]) => `${p}=${v}`).join(", ")}
        <br />
        classifyFailure({log.node}) = <strong>{verdict}</strong>
      </div>
    </>
  );
}

/** Checkpoint: classify all four nodes' round logs correctly — one of each failure mode. */
export function DistributedSystemModelsCheckpoint() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, FailureMode | null>>({});
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const log = ROUND_LOGS[index];
  const options: FailureMode[] = ["correct", "crash", "omission", "byzantine"];

  const allAnswered = ROUND_LOGS.every((l) => answers[l.node] != null);
  const allCorrect = ROUND_LOGS.every((l) => answers[l.node] === classifyFailure(l));
  const passed = allAnswered && allCorrect;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const pick = (mode: FailureMode) => {
    setHasInteracted(true);
    setAnswers((prev) => ({ ...prev, [log.node]: mode }));
  };

  const answeredThis = answers[log.node];

  return (
    <CheckpointFrame
      instructions={
        <>
          For each node A–D, read its round log and classify what happened: <strong>correct</strong>,{" "}
          <strong>crash</strong>, <strong>omission</strong>, or <strong>byzantine</strong>. Get all four right.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a classification for node A"
    >
      <div className={styles.buttons}>
        {ROUND_LOGS.map((l, i) => (
          <button
            key={l.node}
            type="button"
            className={i === index ? styles.buttonPrimary : styles.button}
            onClick={() => setIndex(i)}
          >
            {l.node} {answers[l.node] ? "✓" : ""}
          </button>
        ))}
      </div>
      <div className={styles.script}>
        {log.node} expected to send: {Object.entries(log.expected).map(([p, v]) => `${p}=${v}`).join(", ")}
        <br />
        {log.node} actually sent: {Object.keys(log.actual).length === 0
          ? "nothing"
          : Object.entries(log.actual).map(([p, v]) => `${p}=${v}`).join(", ")}
      </div>
      <div className={styles.buttons} style={{ marginTop: 10 }}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={answeredThis === opt ? styles.buttonPrimary : styles.button}
            onClick={() => pick(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
