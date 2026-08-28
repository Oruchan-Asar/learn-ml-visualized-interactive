"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ContributionBars } from "@/components/viz/ContributionBars";
import {
  buildTrace,
  roundTrips,
  safeDefaultOnTimeout,
  ALL_YES_VOTES,
  P2_NO_VOTES,
  type ParticipantState,
  type Decision,
} from "@/lib/math-core/three-phase-commit";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "three-phase-commit";

function StepScript({ index, total, phase, text }: { index: number; total: number; phase: 1 | 2 | 3; text: string }) {
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

/** Intuition beat: step through the commit-path trace, phase by phase — vote, then pre-commit, then commit. */
export function IntuitionDemo() {
  const trace = useMemo(() => buildTrace(ALL_YES_VOTES), []);
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

/** Play beat: switch between the commit path and abort path, and compare round-trip counts against 2PC. */
export function PlayDemo() {
  const [decision, setDecision] = useState<Decision>("commit");
  const votes = decision === "commit" ? ALL_YES_VOTES : P2_NO_VOTES;
  const trace = useMemo(() => buildTrace(votes), [votes]);
  const [i, setI] = useState(0);
  const step = trace[Math.min(i, trace.length - 1)];

  const bars = [
    { label: "2PC round trips", value: roundTrips("2pc", decision) },
    { label: "3PC round trips", value: roundTrips("3pc", decision) },
  ];

  return (
    <>
      <div className={styles.buttons}>
        <button
          type="button"
          className={decision === "commit" ? styles.buttonPrimary : styles.button}
          onClick={() => {
            setDecision("commit");
            setI(0);
          }}
        >
          All vote yes
        </button>
        <button
          type="button"
          className={decision === "abort" ? styles.buttonPrimary : styles.button}
          onClick={() => {
            setDecision("abort");
            setI(0);
          }}
        >
          P2 votes no
        </button>
      </div>
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
      <ContributionBars items={bars} formatValue={(v) => `${v}`} max={3} readout={`${trace.length} total messages this run`} />
    </>
  );
}

const SCENARIOS: { id: string; state: ParticipantState; label: string }[] = [
  { id: "s1", state: "uncertain", label: "P1 voted yes, then heard nothing — no PRE-COMMIT ever arrived." },
  { id: "s2", state: "prepared", label: "P2 already received and acked PRE-COMMIT before the coordinator vanished." },
  { id: "s3", state: "prepared", label: "P3 received PRE-COMMIT — every participant, by definition, must have voted yes." },
  { id: "s4", state: "uncertain", label: "P1 just sent its vote and the coordinator went silent immediately after." },
];

/** Checkpoint: for each stuck participant, decide whether the SAFE default is to commit or abort. */
export function ThreePCCheckpoint() {
  const [answers, setAnswers] = useState<Record<string, Decision | null>>({ s1: null, s2: null, s3: null, s4: null });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = SCENARIOS.every((s) => answers[s.id] === safeDefaultOnTimeout(s.state));

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const answer = (id: string, d: Decision) => {
    setHasInteracted(true);
    setAnswers((prev) => ({ ...prev, [id]: d }));
  };

  return (
    <CheckpointFrame
      instructions={<>For each stuck participant below, pick the outcome it can safely default to on its own, with no word from the coordinator.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Answer all four scenarios"
    >
      {SCENARIOS.map((s) => {
        const correct = safeDefaultOnTimeout(s.state);
        const chosen = answers[s.id];
        return (
          <div key={s.id} className={styles.script} style={{ marginBottom: 8 }}>
            {s.label}
            <div className={styles.buttons} style={{ marginTop: 6 }}>
              <button
                type="button"
                className={chosen === "commit" ? styles.buttonPrimary : styles.button}
                onClick={() => answer(s.id, "commit")}
              >
                Default: commit
              </button>
              <button type="button" className={chosen === "abort" ? styles.buttonPrimary : styles.button} onClick={() => answer(s.id, "abort")}>
                Default: abort
              </button>
              {chosen && <span className={styles.stepCount}>{chosen === correct ? "correct" : "not quite"}</span>}
            </div>
          </div>
        );
      })}
    </CheckpointFrame>
  );
}
