"use client";

import { useEffect, useMemo, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  REPLICAS,
  PRIMARY,
  REQUEST_VALUE,
  PREPARE_VOTES,
  TRACE,
  countMatchingVotes,
  quorumSize,
  minReplicasFor,
  maxToleratedFaults,
} from "@/lib/math-core/byzantine-fault-tolerance-pbft";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import consensusStyles from "../_shared/ConsensusStepControls.module.css";
import stepStyles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "byzantine-fault-tolerance-pbft";

const POSITIONS: Record<string, { x: number; y: number }> = {
  R0: { x: 160, y: 30 },
  R1: { x: 40, y: 140 },
  R2: { x: 160, y: 200 },
  R3: { x: 280, y: 140 },
};

/** Intuition beat: click a backup to reveal its PREPARE vote — R3 always lies or goes silent. */
export function IntuitionDemo() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const onSelect = (id: string) => {
    setRevealed((prev) => new Set(prev).add(id));
  };

  const nodes: GraphNodeSpec[] = REPLICAS.map((id) => {
    const vote = PREPARE_VOTES.find((v) => v.replicaId === id)!;
    const matches = vote.reportedValue === REQUEST_VALUE;
    const label = revealed.has(id) || id === PRIMARY ? `${id}: ${vote.reportedValue ?? "silent"}` : id;
    return { id, x: POSITIONS[id].x, y: POSITIONS[id].y, value: matches ? 1 : 0, label };
  });

  const edges: [string, string][] = REPLICAS.filter((r) => r !== PRIMARY).map((r): [string, string] => [PRIMARY, r]);
  const matches = countMatchingVotes(PREPARE_VOTES, REQUEST_VALUE);

  return (
    <GraphPlayground
      nodes={nodes}
      edges={edges}
      focusNodeId={PRIMARY}
      highlightedNodeIds={PREPARE_VOTES.filter((v) => v.reportedValue === REQUEST_VALUE).map((v) => v.replicaId)}
      onSelectNode={onSelect}
      readout={`Click each backup to reveal its PREPARE vote — ${matches} of 4 replicas agree on ${REQUEST_VALUE}`}
    />
  );
}

/** Play beat: step through the full PRE-PREPARE / PREPARE / COMMIT trace, phase by phase. */
export function PlayDemo() {
  const trace = useMemo(() => TRACE, []);
  const [i, setI] = useState(0);
  const step = trace[i];
  const phaseNames = { 1: "PRE-PREPARE", 2: "PREPARE", 3: "COMMIT" } as const;

  return (
    <>
      <div className={stepStyles.script}>
        <span className={stepStyles.phaseTag}>{phaseNames[step.phase]}</span>
        {step.from} → {step.to}: {step.message} — {step.description}
        <div className={stepStyles.stepCount} style={{ marginTop: 8 }}>
          Step {i + 1} of {trace.length}
        </div>
      </div>
      <div className={stepStyles.buttons}>
        <button type="button" className={stepStyles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          ← Previous
        </button>
        <button
          type="button"
          className={stepStyles.buttonPrimary}
          onClick={() => setI((n) => Math.min(trace.length - 1, n + 1))}
          disabled={i === trace.length - 1}
        >
          Next →
        </button>
      </div>
    </>
  );
}

/** Checkpoint: fix N replicas at 7 and find the maximum number of Byzantine faults it can tolerate. */
export function PbftCheckpoint() {
  const [f, setF] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const fixedN = 7;

  const target = maxToleratedFaults(fixedN);
  const passed = f === target;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const required = minReplicasFor(f);
  const sufficient = fixedN >= required;

  return (
    <CheckpointFrame
      instructions={
        <>
          A cluster is fixed at <strong>N = {fixedN}</strong> replicas. Slide <strong>f</strong> up until you find
          the <strong>maximum</strong> number of Byzantine faults this cluster can still tolerate.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Slide f to try a value"
    >
      <label className={consensusStyles.sliderRow}>
        f
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={f}
          onChange={(e) => {
            setHasInteracted(true);
            setF(Number(e.target.value));
          }}
        />
        {f}
      </label>
      <div className={stepStyles.script}>
        3f + 1 = {required} replicas needed, quorum size 2f + 1 = {quorumSize(f)} — {sufficient ? "N is enough" : "N is NOT enough"}
      </div>
    </CheckpointFrame>
  );
}
