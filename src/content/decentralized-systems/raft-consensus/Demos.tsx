"use client";

import { useEffect, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { CANDIDATE_REQUEST, VOTERS, runElection } from "@/lib/math-core/raft-consensus";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/ConsensusStepControls.module.css";

const CONCEPT_ID = "raft-consensus";

const POSITIONS: Record<string, { x: number; y: number }> = {
  N1: { x: 160, y: 30 },
  N2: { x: 40, y: 110 },
  N3: { x: 100, y: 200 },
  N4: { x: 220, y: 200 },
  N5: { x: 280, y: 110 },
};

const TRACE = runElection(CANDIDATE_REQUEST, VOTERS, 5);

function nodeSpecs(revealed: Set<string>): GraphNodeSpec[] {
  const nodes: GraphNodeSpec[] = [
    { id: "N1", x: POSITIONS.N1.x, y: POSITIONS.N1.y, value: CANDIDATE_REQUEST.lastLog.index, label: "N1 (candidate)" },
  ];
  for (const voter of VOTERS) {
    const grant = TRACE.grants[voter.id];
    nodes.push({
      id: voter.id,
      x: POSITIONS[voter.id].x,
      y: POSITIONS[voter.id].y,
      value: voter.lastLog.index,
      label: revealed.has(voter.id) ? `${voter.id}: ${grant ? "grant" : "reject"}` : voter.id,
    });
  }
  return nodes;
}

const EDGES: [string, string][] = VOTERS.map((v): [string, string] => ["N1", v.id]);

/** Intuition beat: click a voter to reveal whether it grants or rejects N1's vote request, and why. */
export function IntuitionDemo() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const onSelect = (id: string) => {
    if (id === "N1") return;
    setLastClicked(id);
    setRevealed((prev) => new Set(prev).add(id));
  };

  const voter = VOTERS.find((v) => v.id === lastClicked);
  const explanation = voter
    ? `${voter.id}: last entry (term ${voter.lastLog.term}, index ${voter.lastLog.index}) vs N1's (term ${CANDIDATE_REQUEST.lastLog.term}, index ${CANDIDATE_REQUEST.lastLog.index}) — ${TRACE.grants[voter.id] ? "grants" : "rejects"}`
    : "Click a voter to see how it decides";

  return <GraphPlayground nodes={nodeSpecs(revealed)} edges={EDGES} focusNodeId="N1" onSelectNode={onSelect} readout={explanation} />;
}

/** Play beat: reveal every voter's decision at once and read off the resulting tally. */
export function PlayDemo() {
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <GraphPlayground
        nodes={nodeSpecs(revealed ? new Set(VOTERS.map((v) => v.id)) : new Set())}
        edges={EDGES}
        focusNodeId="N1"
        highlightedNodeIds={revealed ? VOTERS.filter((v) => TRACE.grants[v.id]).map((v) => v.id) : []}
        readout={
          revealed
            ? `Total votes for N1: ${TRACE.totalVotes} of 5 — winner: ${TRACE.winner ?? "none (split)"}`
            : "Click below to run the election"
        }
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.buttonPrimary} onClick={() => setRevealed(true)}>
          Run the election
        </button>
        <button type="button" className={styles.button} onClick={() => setRevealed(false)}>
          Reset
        </button>
      </div>
    </>
  );
}

/** Checkpoint: click exactly the voters that grant N1 their vote (N5 should be excluded). */
export function RaftCheckpoint() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const correctGrantors = new Set(VOTERS.filter((v) => TRACE.grants[v.id]).map((v) => v.id));
  const passed =
    selected.size === correctGrantors.size && [...selected].every((id) => correctGrantors.has(id)) && selected.size > 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const toggle = (id: string) => {
    if (id === "N1") return;
    setHasInteracted(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          N1 requests votes for term 5 with last log entry (term 4, index 10). Click every voter that{" "}
          <strong>grants</strong> its vote — leave out any that reject.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click the voters that grant N1 a vote"
    >
      <GraphPlayground
        nodes={VOTERS.map((v) => ({
          id: v.id,
          x: POSITIONS[v.id].x,
          y: POSITIONS[v.id].y,
          value: v.lastLog.index,
          label: `${v.id} (term ${v.lastLog.term})`,
        }))}
        edges={[]}
        highlightedNodeIds={[...selected]}
        onSelectNode={toggle}
        passed={passed}
        readout={`Selected: ${[...selected].join(", ") || "none"}`}
      />
    </CheckpointFrame>
  );
}
