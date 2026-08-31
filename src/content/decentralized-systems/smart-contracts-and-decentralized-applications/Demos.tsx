"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { StepControls } from "../_shared/StepControls";
import {
  BUYER,
  SELLER,
  DEPOSIT_AMOUNT,
  runEscrow,
  type TraceEntry,
} from "@/lib/math-core/smart-contracts-and-decentralized-applications";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";
import descentStyles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "smart-contracts-and-decentralized-applications";

/** One trace step rendered as a monospace line: its label, resulting phase, and the state hash every node would agree on. */
function TraceLine({ entry }: { entry: TraceEntry }) {
  return (
    <div className={styles.script}>
      <span className={styles.phaseTag}>{entry.state.phase}</span>
      {entry.label} — balance {entry.state.balance}, stateHash = {entry.hash}
    </div>
  );
}

/** Intuition beat: step through a fixed deposit-then-release script one action at a time. */
export function IntuitionDemo() {
  const trace = useMemo(() => runEscrow("release"), []);
  const [i, setI] = useState(0);

  return (
    <>
      <TraceLine entry={trace[i]} />
      <StepControls index={i} total={trace.length} onPrev={() => setI((n) => Math.max(0, n - 1))} onNext={() => setI((n) => Math.min(trace.length - 1, n + 1))} />
    </>
  );
}

/** Play beat: fund the contract, then pick which way it resolves, and watch the state (and its hash) branch accordingly. */
export function PlayDemo() {
  const [outcome, setOutcome] = useState<"release" | "refund" | null>(null);
  const trace = useMemo(() => runEscrow(outcome), [outcome]);
  const [i, setI] = useState(0);

  const choose = (o: "release" | "refund" | null) => {
    setOutcome(o);
    setI(0);
  };

  return (
    <>
      <div className={descentStyles.buttons}>
        <button type="button" className={outcome === "release" ? descentStyles.buttonPrimary : descentStyles.button} onClick={() => choose("release")}>
          Condition met (release)
        </button>
        <button type="button" className={outcome === "refund" ? descentStyles.buttonPrimary : descentStyles.button} onClick={() => choose("refund")}>
          Condition failed (refund)
        </button>
      </div>
      <TraceLine entry={trace[i]} />
      <StepControls index={i} total={trace.length} onPrev={() => setI((n) => Math.max(0, n - 1))} onNext={() => setI((n) => Math.min(trace.length - 1, n + 1))} />
      <p className={descentStyles.stepCount}>
        Final state hash: {trace[trace.length - 1].hash} — anyone replaying these same 3 actions computes this exact
        number, no coordination required.
      </p>
    </>
  );
}

/**
 * Checkpoint: drive the contract to BOTH resolutions — released and refunded — not just one. With only
 * two buttons and one outcome checked, a single click had 50% odds and trying both guaranteed a pass;
 * requiring both branches means actually seeing that the same contract can end either way.
 */
export function EscrowCheckpoint() {
  const [outcome, setOutcome] = useState<"release" | "refund" | null>(null);
  const [seenPhases, setSeenPhases] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const trace = runEscrow(outcome);
  const finalEntry = trace[trace.length - 1];
  const passed = seenPhases.has("released") && seenPhases.has("refunded");

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const choose = (o: "release" | "refund" | null) => {
    setHasInteracted(true);
    setOutcome(o);
    const t = runEscrow(o);
    setSeenPhases((prev) => new Set(prev).add(t[t.length - 1].state.phase));
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          {BUYER} deposits {DEPOSIT_AMOUNT}. Drive the contract to <strong>both</strong> resolutions — released
          (the branch where {SELLER} gets paid) and refunded (the branch where they don&apos;t) — to see that the
          same contract can end either way.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick how the contract resolves"
    >
      <div className={descentStyles.buttons}>
        <button type="button" className={outcome === "release" ? descentStyles.buttonPrimary : descentStyles.button} onClick={() => choose("release")}>
          Condition met (release)
        </button>
        <button type="button" className={outcome === "refund" ? descentStyles.buttonPrimary : descentStyles.button} onClick={() => choose("refund")}>
          Condition failed (refund)
        </button>
      </div>
      {outcome !== null && <TraceLine entry={finalEntry} />}
      <p className={descentStyles.stepCount}>
        Seen so far: {seenPhases.size === 0 ? "neither" : [...seenPhases].sort().join(", ")}
      </p>
    </CheckpointFrame>
  );
}
