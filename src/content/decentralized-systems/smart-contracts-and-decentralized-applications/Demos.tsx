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

/** Checkpoint: drive the contract to the refunded phase — deposit, then pick the branch where the condition fails. */
export function EscrowCheckpoint() {
  const [outcome, setOutcome] = useState<"release" | "refund" | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const trace = runEscrow(outcome);
  const finalEntry = trace[trace.length - 1];
  const passed = finalEntry.state.phase === "refunded";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const choose = (o: "release" | "refund" | null) => {
    setHasInteracted(true);
    setOutcome(o);
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          {BUYER} deposits {DEPOSIT_AMOUNT}. Drive the contract to the <strong>refunded</strong> phase — the branch
          where {SELLER} never gets paid.
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
    </CheckpointFrame>
  );
}
