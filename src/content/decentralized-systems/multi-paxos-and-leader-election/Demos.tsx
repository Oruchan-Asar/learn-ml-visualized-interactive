"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { plainPaxosMessages, multiPaxosMessages, messagesSaved } from "@/lib/math-core/multi-paxos-and-leader-election";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/ConsensusStepControls.module.css";

const CONCEPT_ID = "multi-paxos-and-leader-election";
const MAX_DECISIONS = 8;

function bars(k: number) {
  return [
    { label: "Plain Paxos", value: plainPaxosMessages(k) },
    { label: "Multi-Paxos", value: multiPaxosMessages(k) },
  ];
}

function DecisionsSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className={styles.sliderRow}>
      decisions (k)
      <input
        type="range"
        min={1}
        max={MAX_DECISIONS}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {value}
    </label>
  );
}

/** Intuition beat: a fixed 5-decision comparison — plain Paxos vs. a stable Multi-Paxos leader. */
export function IntuitionDemo() {
  const k = 5;
  return (
    <ContributionBars
      items={bars(k)}
      max={plainPaxosMessages(MAX_DECISIONS)}
      formatValue={(v) => `${v} msgs`}
      readout={`${k} decisions: plain Paxos costs ${plainPaxosMessages(k)} messages, Multi-Paxos costs ${multiPaxosMessages(k)}`}
    />
  );
}

/** Play beat: slide the number of decisions and watch the gap between the two costs widen. */
export function PlayDemo() {
  const [k, setK] = useState(5);
  return (
    <>
      <ContributionBars
        items={bars(k)}
        max={plainPaxosMessages(MAX_DECISIONS)}
        formatValue={(v) => `${v} msgs`}
        readout={`Messages saved by reusing the leader: ${messagesSaved(k)}`}
      />
      <div className={styles.controls}>
        <DecisionsSlider value={k} onChange={setK} />
      </div>
    </>
  );
}

/** Checkpoint: find the number of decisions k where Multi-Paxos saves exactly 10 messages. */
export function MultiPaxosCheckpoint() {
  const [k, setK] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const target = 10;
  const passed = messagesSaved(k) === target;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide k (the number of decided log slots) until Multi-Paxos saves exactly <strong>{target}</strong>{" "}
          messages compared to plain Paxos.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Slide k to try a value"
    >
      <ContributionBars
        items={bars(k)}
        max={plainPaxosMessages(MAX_DECISIONS)}
        formatValue={(v) => `${v} msgs`}
        readout={`Messages saved: ${messagesSaved(k)}`}
      />
      <div className={styles.controls}>
        <DecisionsSlider
          value={k}
          onChange={(v) => {
            setHasInteracted(true);
            setK(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
