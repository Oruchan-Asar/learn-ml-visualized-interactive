"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { StepTrace } from "../_shared/ConsensusStepControls";
import { ROUND_1_PROMISES, ROUND_2_PROMISES, valueToPropose, isChosen } from "@/lib/math-core/paxos";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/ConsensusStepControls.module.css";

const CONCEPT_ID = "paxos";

const ROUND_1_SCRIPT = [
  "Proposer P1 picks proposal number n=1 and sends PREPARE(1) to A1, A2, A3.",
  "A1, A2, A3 have never promised anything before — each replies PROMISE(1), accepted: none.",
  "P1 has a majority of promises (3 of 3) — no acceptor reported a prior accepted value.",
  `Since nothing was previously accepted, P1 proposes its own value: valueToPropose = "${valueToPropose(ROUND_1_PROMISES, "X")}".`,
  "P1 sends ACCEPT(1, \"X\") to A1, A2, A3. All three accept — that's a majority, so X is chosen.",
];

const ROUND_2_SCRIPT = [
  'Later, proposer P2 (unaware X was already chosen) picks a higher number n=2 and sends PREPARE(2) to A1, A2, A3.',
  'A1 already accepted (1, "X") earlier — it replies PROMISE(2), accepted: (1, "X"). A2 and A3 reply PROMISE(2), accepted: none.',
  "P2 has a majority of promises (3 of 3) — but A1's reply reports a previously accepted value.",
  `Paxos's safety rule: P2 must adopt the highest-numbered accepted value it sees, not its own. valueToPropose = "${valueToPropose(ROUND_2_PROMISES, "Y")}" — even though P2 wanted to propose "Y".`,
  'P2 sends ACCEPT(2, "X") — the same value as before. The chosen value never changes, only its proposal number.',
];

function useStepper(total: number) {
  const [index, setIndex] = useState(0);
  return {
    index,
    onPrev: () => setIndex((i) => Math.max(0, i - 1)),
    onNext: () => setIndex((i) => Math.min(total - 1, i + 1)),
    reset: () => setIndex(0),
  };
}

/** Intuition beat: step through a clean round — no prior accepted value, so the proposer's own value wins. */
export function IntuitionDemo() {
  const { index, onPrev, onNext } = useStepper(ROUND_1_SCRIPT.length);
  return (
    <StepTrace
      lines={ROUND_1_SCRIPT[index]}
      index={index}
      total={ROUND_1_SCRIPT.length}
      onPrev={onPrev}
      onNext={onNext}
      footer={`majority reached: ${isChosen(3, 3) ? "yes" : "no"}`}
    />
  );
}

/** Play beat: step through the conflicting round, watching the safety rule force P2 to keep the chosen value. */
export function PlayDemo() {
  const { index, onPrev, onNext } = useStepper(ROUND_2_SCRIPT.length);
  return (
    <StepTrace
      lines={ROUND_2_SCRIPT[index]}
      index={index}
      total={ROUND_2_SCRIPT.length}
      onPrev={onPrev}
      onNext={onNext}
      footer={`P2's own value was "Y"; the value it must actually propose is "${valueToPropose(ROUND_2_PROMISES, "Y")}"`}
    />
  );
}

/** Checkpoint: given round 2's promises, pick which value the proposer must use in the accept phase. */
export function PaxosCheckpoint() {
  const [choice, setChoice] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const correct = valueToPropose(ROUND_2_PROMISES, "Y");
  const passed = choice === correct;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          P2 proposes number 2 with its own value <strong>Y</strong>. A1 promises but reports it already accepted{" "}
          <strong>(1, X)</strong>; A2 and A3 report nothing accepted. Which value must P2 send in the ACCEPT
          phase?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick the value P2 must propose"
    >
      <div className={styles.buttons}>
        <button
          type="button"
          className={choice === "X" ? styles.buttonSelected : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setChoice("X");
          }}
        >
          Propose &quot;X&quot; (the previously accepted value)
        </button>
        <button
          type="button"
          className={choice === "Y" ? styles.buttonSelected : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setChoice("Y");
          }}
        >
          Propose &quot;Y&quot; (P2&rsquo;s own value)
        </button>
      </div>
    </CheckpointFrame>
  );
}
