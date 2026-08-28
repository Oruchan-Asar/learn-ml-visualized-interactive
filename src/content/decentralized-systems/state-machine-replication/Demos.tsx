"use client";

import { useEffect, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { LOG, REORDERED_LOG, appliedPrefix } from "@/lib/math-core/state-machine-replication";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/ConsensusStepControls.module.css";

const CONCEPT_ID = "state-machine-replication";

/** Intuition beat: step a lagging Follower through the log, one command at a time, toward the Leader. */
export function IntuitionDemo() {
  const [n, setN] = useState(0);
  const leaderState = appliedPrefix(LOG, LOG.length);
  const followerState = appliedPrefix(LOG, n);
  const caughtUp = n === LOG.length;

  const nodes: GraphNodeSpec[] = [
    { id: "Leader", x: 90, y: 100, value: leaderState.x ?? 0, label: "Leader (applied all 5)" },
    { id: "Follower", x: 260, y: 100, value: followerState.x ?? 0, label: `Follower (applied ${n})` },
  ];

  return (
    <>
      <GraphPlayground
        nodes={nodes}
        edges={[["Leader", "Follower"]]}
        highlightedNodeIds={caughtUp ? ["Follower"] : []}
        readout={
          caughtUp
            ? "Follower applied the same 5 commands, in the same order — its state matches the Leader exactly."
            : `Command ${n + 1} of ${LOG.length} next: ${describeCommand(n)}`
        }
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setN(0)} disabled={n === 0}>
          Reset
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setN((v) => Math.min(LOG.length, v + 1))}
          disabled={n === LOG.length}
        >
          Apply next command
        </button>
      </div>
    </>
  );
}

function describeCommand(n: number): string {
  const cmd = LOG[n];
  if (!cmd) return "";
  if (cmd.op === "set") return `SET x = ${cmd.value}`;
  if (cmd.op === "add") return `ADD x += ${cmd.delta}`;
  return `DEL x`;
}

/** Play beat: compare the canonical log against the same commands reordered — same set, different result. */
export function PlayDemo() {
  const [n, setN] = useState(LOG.length);
  const canonical = appliedPrefix(LOG, n);
  const reordered = appliedPrefix(REORDERED_LOG, n);

  const nodes: GraphNodeSpec[] = [
    { id: "Canonical", x: 90, y: 100, value: canonical.x ?? 0, label: "Canonical order" },
    { id: "Reordered", x: 260, y: 100, value: reordered.x ?? 0, label: "Reordered (same commands)" },
  ];

  return (
    <>
      <GraphPlayground
        nodes={nodes}
        edges={[]}
        readout={
          canonical.x === reordered.x
            ? `After ${n} commands, both orders happen to agree: x = ${canonical.x ?? 0}`
            : `After ${n} commands: canonical x = ${canonical.x ?? 0}, reordered x = ${reordered.x ?? 0} — same commands, different order, different state`
        }
      />
      <label className={styles.sliderRow}>
        commands applied (n)
        <input
          type="range"
          min={0}
          max={LOG.length}
          step={1}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
        />
        {n}
      </label>
    </>
  );
}

/** Checkpoint: slide the number of applied log entries until the canonical state hits x = 12. */
export function SmrCheckpoint() {
  const [n, setN] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const target = 12;
  const state = appliedPrefix(LOG, n);
  const passed = state.x === target;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide the number of applied log entries until the state machine reaches <strong>x = {target}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Slide n to try a value"
    >
      <GraphPlayground
        nodes={[{ id: "x", x: 160, y: 100, value: state.x ?? 0, label: `x after ${n} commands` }]}
        edges={[]}
        passed={passed}
        focusNodeId="x"
        readout={`x = ${state.x ?? 0}`}
      />
      <label className={styles.sliderRow}>
        commands applied (n)
        <input
          type="range"
          min={0}
          max={LOG.length}
          step={1}
          value={n}
          onChange={(e) => {
            setHasInteracted(true);
            setN(Number(e.target.value));
          }}
        />
        {n}
      </label>
    </CheckpointFrame>
  );
}
