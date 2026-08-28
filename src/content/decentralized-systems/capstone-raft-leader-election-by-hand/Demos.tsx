"use client";

import { useEffect, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TERM_6_N1_REQUEST,
  TERM_6_N3_REQUEST,
  TERM_6_N1_TRACE,
  TERM_6_N3_TRACE,
  TERM_7_N1_REQUEST,
  TERM_7_TRACE,
  isSplitVote,
} from "@/lib/math-core/capstone-raft-leader-election-by-hand";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/ConsensusStepControls.module.css";

const CONCEPT_ID = "capstone-raft-leader-election-by-hand";

const POSITIONS: Record<string, { x: number; y: number }> = {
  N1: { x: 60, y: 30 },
  N2: { x: 20, y: 130 },
  N3: { x: 260, y: 30 },
  N4: { x: 300, y: 130 },
  N5: { x: 160, y: 200 },
};

/** Intuition beat: click a voter to see which of the two term-6 candidates it granted, and why. */
export function IntuitionDemo() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const grantedTo = (id: string): string | null => {
    if (id === "N1" || id === "N3") return null;
    if (TERM_6_N1_TRACE.grants[id]) return "N1";
    if (TERM_6_N3_TRACE.grants[id]) return "N3";
    return "neither";
  };

  const onSelect = (id: string) => {
    if (id === "N1" || id === "N3") return;
    setRevealed((prev) => new Set(prev).add(id));
  };

  const nodes: GraphNodeSpec[] = ["N1", "N2", "N3", "N4", "N5"].map((id) => {
    const isCandidate = id === "N1" || id === "N3";
    const label = isCandidate || revealed.has(id) ? `${id}${isCandidate ? " (candidate)" : `: grants ${grantedTo(id)}`}` : id;
    return { id, x: POSITIONS[id].x, y: POSITIONS[id].y, value: isCandidate ? 1 : 0, label };
  });

  const edges: [string, string][] = [
    ["N1", "N2"],
    ["N1", "N4"],
    ["N1", "N5"],
    ["N3", "N2"],
    ["N3", "N4"],
    ["N3", "N5"],
  ];

  return (
    <GraphPlayground
      nodes={nodes}
      edges={edges}
      highlightedNodeIds={["N1", "N3"]}
      onSelectNode={onSelect}
      readout="N1 and N3 both time out and campaign for term 6. Click N2, N4, or N5 to see which one it granted."
      width={340}
      height={230}
    />
  );
}

const ROUNDS = [
  { label: "Term 6 — N1's request", request: TERM_6_N1_REQUEST, trace: TERM_6_N1_TRACE },
  { label: "Term 6 — N3's request", request: TERM_6_N3_REQUEST, trace: TERM_6_N3_TRACE },
  { label: "Term 7 — N1 retries alone", request: TERM_7_N1_REQUEST, trace: TERM_7_TRACE },
];

/** Play beat: step through all three RequestVote rounds — the split vote, then the resolution. */
export function PlayDemo() {
  const [i, setI] = useState(0);
  const round = ROUNDS[i];
  const grantedIds = Object.entries(round.trace.grants).filter(([, g]) => g).map(([id]) => id);

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.script}>
          <strong>{round.label}</strong> — candidate {round.request.candidateId} (log term {round.request.lastLog.term}, index{" "}
          {round.request.lastLog.index}) requests votes.
          <br />
          Grants: {grantedIds.length > 0 ? grantedIds.join(", ") : "none"} + self = {round.trace.totalVotes} of 5 total.
        </div>
        <div className={styles.readout}>
          {round.trace.winner ? `Winner: ${round.trace.winner}` : "No majority — split vote"}
        </div>
      </div>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          ← Previous
        </button>
        <span className={styles.counter}>
          Round {i + 1} of {ROUNDS.length}
        </span>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(ROUNDS.length - 1, n + 1))}
          disabled={i === ROUNDS.length - 1}
        >
          Next →
        </button>
      </div>
    </>
  );
}

/** Checkpoint: click exactly the term-7 voters that grant N1 its vote (only N5 should be excluded). */
export function CapstoneCheckpoint() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const correctGrantors = new Set(Object.entries(TERM_7_TRACE.grants).filter(([, g]) => g).map(([id]) => id));
  const passed =
    selected.size === correctGrantors.size && [...selected].every((id) => correctGrantors.has(id)) && selected.size > 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const toggle = (id: string) => {
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
          Term 6 ended in a split vote, so N1 tries again in term 7 with the same log (term 5, index 20). Click
          every voter that <strong>grants</strong> N1&apos;s request this time — leave out any that reject. (Confirms
          the split-vote scenario is now resolved: <code>isSplitVote</code> is no longer true once N1 wins.)
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click the voters that grant N1 a vote in term 7"
    >
      <GraphPlayground
        nodes={["N2", "N3", "N4", "N5"].map((id) => ({
          id,
          x: POSITIONS[id].x,
          y: POSITIONS[id].y,
          value: 0,
          label: id,
        }))}
        edges={[]}
        highlightedNodeIds={[...selected]}
        onSelectNode={toggle}
        passed={passed}
        readout={`Selected: ${[...selected].join(", ") || "none"} — split vote resolved: ${isSplitVote([TERM_6_N1_TRACE, TERM_6_N3_TRACE])}`}
        width={340}
        height={230}
      />
    </CheckpointFrame>
  );
}
