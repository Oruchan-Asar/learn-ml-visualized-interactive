"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { GraphPlayground } from "@/components/viz/GraphPlayground";
import {
  STALE_PARTITION_SCENARIO,
  resolveDuringPartition,
  pacelcLabel,
  SYSTEM_PROFILES,
  systemLabel,
  type CapChoice,
} from "@/lib/math-core/the-cap-theorem-and-pacelc";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "the-cap-theorem-and-pacelc";

const PARTITION_NODES = [
  { id: "R1", x: 60, y: 100, value: 2, label: "R1 (has latest)" },
  { id: "R3", x: 60, y: 180, value: 2, label: "R3 (has latest)" },
  { id: "R2", x: 260, y: 140, value: 1, label: "R2 (requesting)" },
];
const PARTITION_EDGES: [string, string][] = [["R1", "R3"]]; // R2 is cut off — no edge to R1/R3

/** Intuition beat: toggle CP vs AP during a fixed partition and read off what the requester actually gets. */
export function IntuitionDemo() {
  const [choice, setChoice] = useState<CapChoice>("CP");
  const result = resolveDuringPartition(STALE_PARTITION_SCENARIO, choice);

  return (
    <>
      <GraphPlayground
        nodes={PARTITION_NODES}
        edges={PARTITION_EDGES}
        focusNodeId="R2"
        highlightedNodeIds={["R1", "R3"]}
        readout="R2 is cut off from R1/R3, which hold the newest write."
      />
      <div className={styles.buttons}>
        <button type="button" className={choice === "CP" ? styles.buttonPrimary : styles.button} onClick={() => setChoice("CP")}>
          CP
        </button>
        <button type="button" className={choice === "AP" ? styles.buttonPrimary : styles.button} onClick={() => setChoice("AP")}>
          AP
        </button>
      </div>
      <div className={styles.script}>
        {result.responds
          ? `R2 answers with value ${result.value} — ${result.consistent ? "which happens to be correct" : "but it's stale"}.`
          : "R2 refuses to answer at all, rather than risk returning a stale value."}
      </div>
    </>
  );
}

/** Play beat: toggle both PACELC axes and see which (if any) of the three example systems matches the label. */
export function PlayDemo() {
  const [duringPartition, setDuringPartition] = useState(true);
  const [elseCase, setElseCase] = useState(true);
  const label = pacelcLabel(duringPartition, elseCase);
  const match = SYSTEM_PROFILES.find((p) => systemLabel(p) === label);

  return (
    <>
      <div className={styles.buttons}>
        <button
          type="button"
          className={duringPartition ? styles.buttonPrimary : styles.button}
          onClick={() => setDuringPartition((v) => !v)}
        >
          During partition: {duringPartition ? "choose Consistency" : "choose Availability"}
        </button>
        <button type="button" className={elseCase ? styles.buttonPrimary : styles.button} onClick={() => setElseCase((v) => !v)}>
          Else (no partition): {elseCase ? "choose Consistency" : "choose Latency"}
        </button>
      </div>
      <div className={styles.script}>
        pacelcLabel = <strong>{label}</strong>
        <br />
        {match ? `Matches: ${match.name}` : "No system among the three examples below has exactly this combination."}
      </div>
      <div className={styles.script}>
        {SYSTEM_PROFILES.map((p) => (
          <div key={p.name}>
            {p.name}: {systemLabel(p)}
          </div>
        ))}
      </div>
    </>
  );
}

/** Checkpoint: click CP and AP against the same stale scenario until you've seen both a consistent and an inconsistent response. */
export function CapTheoremCheckpoint() {
  const [choice, setChoice] = useState<CapChoice | null>(null);
  const [seen, setSeen] = useState<Set<boolean>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = seen.size === 2;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const pick = (c: CapChoice) => {
    setHasInteracted(true);
    setChoice(c);
    const result = resolveDuringPartition(STALE_PARTITION_SCENARIO, c);
    setSeen((prev) => new Set(prev).add(result.consistent));
  };

  const result = choice ? resolveDuringPartition(STALE_PARTITION_SCENARIO, choice) : null;

  return (
    <CheckpointFrame
      instructions={
        <>
          R2 is cut off from the latest write. Click <strong>CP</strong> and <strong>AP</strong> until you&apos;ve
          produced both a <strong>consistent</strong> response and an <strong>inconsistent</strong> one.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click CP or AP"
    >
      <div className={styles.buttons}>
        <button type="button" className={choice === "CP" ? styles.buttonPrimary : styles.button} onClick={() => pick("CP")}>
          CP
        </button>
        <button type="button" className={choice === "AP" ? styles.buttonPrimary : styles.button} onClick={() => pick("AP")}>
          AP
        </button>
      </div>
      <div className={styles.script}>
        {result
          ? result.responds
            ? `responds: true, value: ${result.value}, consistent: ${result.consistent}`
            : `responds: false, value: null, consistent: ${result.consistent}`
          : "pick a choice"}
        <br />
        seen so far: {seen.size === 0 ? "none" : [...seen].map((c) => (c ? "consistent" : "inconsistent")).join(", ")}
      </div>
    </CheckpointFrame>
  );
}
