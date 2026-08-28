"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  PARTICIPANTS,
  decide,
  buildTrace,
  isBlocked,
  type ParticipantId,
  type VoteMap,
} from "@/lib/math-core/two-phase-commit";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "two-phase-commit";

function StepScript({ index, total, text, phase }: { index: number; total: number; text: string; phase: 1 | 2 }) {
  return (
    <div className={styles.script}>
      <span className={styles.phaseTag}>PHASE {phase}</span>
      {text}
      <div className={styles.stepCount} style={{ marginTop: 8 }}>
        Step {index + 1} of {total}
      </div>
    </div>
  );
}

function VoteToggles({ votes, onToggle }: { votes: VoteMap; onToggle: (p: ParticipantId) => void }) {
  return (
    <div className={styles.buttons}>
      {PARTICIPANTS.map((p) => (
        <button
          key={p}
          type="button"
          className={votes[p] === "yes" ? styles.buttonPrimary : styles.button}
          onClick={() => onToggle(p)}
        >
          {p}: {votes[p].toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** Intuition beat: step through the all-yes trace, phase by phase, message by message. */
export function IntuitionDemo() {
  const votes: VoteMap = { P1: "yes", P2: "yes", P3: "yes" };
  const trace = useMemo(() => buildTrace(votes), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const step = trace[i];

  return (
    <>
      <StepScript index={i} total={trace.length} phase={step.phase} text={`${step.from} → ${step.to}: ${step.message} — ${step.description}`} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          Previous
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(trace.length - 1, n + 1))}
          disabled={i === trace.length - 1}
        >
          Next
        </button>
      </div>
    </>
  );
}

/**
 * Play beat: toggle each participant's vote and watch the coordinator's decision and full trace
 * update, then crash the coordinator mid-protocol to see which participants get stuck blocked.
 */
export function PlayDemo() {
  const [votes, setVotes] = useState<VoteMap>({ P1: "yes", P2: "yes", P3: "yes" });
  const [coordinatorAlive, setCoordinatorAlive] = useState(true);
  const trace = useMemo(() => buildTrace(votes), [votes]);
  const [i, setI] = useState(0);
  const decision = decide(votes);
  const step = trace[Math.min(i, trace.length - 1)];
  const blocked = isBlocked(votes, coordinatorAlive);

  const toggle = (p: ParticipantId) => {
    setVotes((v) => ({ ...v, [p]: v[p] === "yes" ? "no" : "yes" }));
    setI(0);
  };

  return (
    <>
      <VoteToggles votes={votes} onToggle={toggle} />
      <StepScript index={i} total={trace.length} phase={step.phase} text={`${step.from} → ${step.to}: ${step.message} — ${step.description}`} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          Previous
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(trace.length - 1, n + 1))}
          disabled={i === trace.length - 1}
        >
          Next
        </button>
        <button type="button" className={coordinatorAlive ? styles.button : styles.buttonPrimary} onClick={() => setCoordinatorAlive((a) => !a)}>
          Coordinator: {coordinatorAlive ? "alive" : "crashed"}
        </button>
        <span className={styles.stepCount}>decision: {decision.toUpperCase()}</span>
      </div>
      {!coordinatorAlive && (
        <div className={styles.script}>
          {blocked
            ? "Every participant already voted yes, and now the coordinator is gone — they're all blocked, holding their locks, unable to safely guess commit or abort."
            : "At least one participant hasn't voted yes, so no locks are at risk here even with the coordinator down."}
        </div>
      )}
    </>
  );
}

/**
 * Checkpoint: toggle votes freely and produce both a COMMIT and an ABORT outcome, at least once each,
 * to confirm the "any single no aborts everyone" rule isn't just memorized on one example.
 */
export function TwoPCCheckpoint() {
  const [votes, setVotes] = useState<VoteMap>({ P1: "yes", P2: "yes", P3: "yes" });
  const [seen, setSeen] = useState<Set<"commit" | "abort">>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const decision = decide(votes);
  const passed = seen.has("commit") && seen.has("abort");

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const toggle = (p: ParticipantId) => {
    setHasInteracted(true);
    const next: VoteMap = { ...votes, [p]: votes[p] === "yes" ? "no" : "yes" };
    setVotes(next);
    setSeen((prev) => new Set(prev).add(decide(next)));
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          Toggle the three votes until you&apos;ve produced <strong>both</strong> a COMMIT and an ABORT outcome.
          Seen so far: {seen.size ? [...seen].join(", ").toUpperCase() : "none"}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a participant to flip its vote"
    >
      <VoteToggles votes={votes} onToggle={toggle} />
      <div className={styles.script}>Current decision: <strong>{decision.toUpperCase()}</strong></div>
    </CheckpointFrame>
  );
}
