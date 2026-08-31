"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  scoreDesign,
  isCoherentDesign,
  PASS_THRESHOLD,
  type Design,
  type ConsistencyModel,
  type ReplicationStrategy,
  type ConsensusProtocol,
} from "@/lib/math-core/capstone-design-a-decentralized-system";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../ipfs-and-content-addressed-storage/Controls.module.css";
import traceStyles from "../zero-knowledge-proofs/Trace.module.css";

const CONCEPT_ID = "capstone-design-a-decentralized-system";

const CONSISTENCY_OPTIONS: { value: ConsistencyModel; label: string }[] = [
  { value: "eventual", label: "Eventual" },
  { value: "causal", label: "Causal" },
  { value: "linearizability", label: "Linearizability" },
];
const REPLICATION_OPTIONS: { value: ReplicationStrategy; label: string }[] = [
  { value: "gossip", label: "Gossip" },
  { value: "quorum", label: "Quorum" },
  { value: "primary-backup", label: "Primary-backup" },
];
const CONSENSUS_OPTIONS: { value: ConsensusProtocol; label: string }[] = [
  { value: "none", label: "None" },
  { value: "raft", label: "Raft" },
  { value: "pbft", label: "PBFT" },
];

function AxisPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.row}>
      <label>{label}</label>
      <div className={styles.buttons}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={opt.value === value ? styles.buttonActive : styles.button}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Reconstructs the three independent per-axis contributions from scoreDesign's sum, without needing
 * to import the private per-axis score tables: since the three terms add independently, pinning the
 * other two axes at the "best" choice (eventual / gossip / none, which sum to 60/60/80 respectively
 * once the axis under test is included) isolates exactly one term at a time.
 */
function axisContributions(design: Design) {
  const total = scoreDesign(design);
  const consistencyScore = scoreDesign({ consistency: design.consistency, replication: "gossip", consensus: "none" }) - 60;
  const replicationScore = scoreDesign({ consistency: "eventual", replication: design.replication, consensus: "none" }) - 60;
  const consensusScore = scoreDesign({ consistency: "eventual", replication: "gossip", consensus: design.consensus }) - 80;
  return { total, consistencyScore, replicationScore, consensusScore };
}

function ScoreBreakdown({ design }: { design: Design }) {
  const { total, consistencyScore, replicationScore, consensusScore } = axisContributions(design);
  const pass = isCoherentDesign(design);
  const items = [
    { label: `Consistency (${design.consistency})`, value: consistencyScore },
    { label: `Replication (${design.replication})`, value: replicationScore },
    { label: `Consensus (${design.consensus})`, value: consensusScore },
  ];
  return (
    <>
      <ContributionBars items={items} max={40} formatValue={(v) => v.toFixed(0)} />
      <p className={traceStyles.final}>
        total score = <code>{total}</code> (threshold {PASS_THRESHOLD}) —{" "}
        <span className={pass ? traceStyles.pass : traceStyles.fail}>
          {pass ? "✓ coherent fit" : "✗ not a coherent fit"}
        </span>
      </p>
    </>
  );
}

/** Intuition beat: hold replication and consensus fixed at a middling choice, and vary only consistency —
 *  isolating how much of the score swings on that one axis for this exact scenario. */
export function IntuitionDemo() {
  const [consistency, setConsistency] = useState<ConsistencyModel>("linearizability");
  const design: Design = { consistency, replication: "quorum", consensus: "raft" };

  return (
    <>
      <ScoreBreakdown design={design} />
      <div className={styles.controls}>
        <AxisPicker label="consistency model" options={CONSISTENCY_OPTIONS} value={consistency} onChange={setConsistency} />
      </div>
    </>
  );
}

/** Play beat: pick all three axes freely and watch the full score breakdown and pass/fail verdict update. */
export function PlayDemo() {
  const [consistency, setConsistency] = useState<ConsistencyModel>("causal");
  const [replication, setReplication] = useState<ReplicationStrategy>("quorum");
  const [consensus, setConsensus] = useState<ConsensusProtocol>("raft");
  const design: Design = { consistency, replication, consensus };

  return (
    <>
      <ScoreBreakdown design={design} />
      <div className={styles.controls}>
        <AxisPicker label="consistency" options={CONSISTENCY_OPTIONS} value={consistency} onChange={setConsistency} />
        <AxisPicker label="replication" options={REPLICATION_OPTIONS} value={replication} onChange={setReplication} />
        <AxisPicker label="consensus" options={CONSENSUS_OPTIONS} value={consensus} onChange={setConsensus} />
      </div>
    </>
  );
}

/**
 * Checkpoint: find the single BEST-scoring combination of the three axes, not just any combination
 * that clears the pass threshold. 4 of the 27 possible combinations already clear {PASS_THRESHOLD}
 * points, so "any combo above threshold" is guessable in a couple of tries — requiring the unique
 * top score forces actually reasoning about all three axes together.
 */
export function CapstoneDesignCheckpoint() {
  const [consistency, setConsistency] = useState<ConsistencyModel>("linearizability");
  const [replication, setReplication] = useState<ReplicationStrategy>("primary-backup");
  const [consensus, setConsensus] = useState<ConsensusProtocol>("pbft");
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const design: Design = { consistency, replication, consensus };
  const score = scoreDesign(design);
  const bestScore = Math.max(
    ...CONSISTENCY_OPTIONS.flatMap((c) =>
      REPLICATION_OPTIONS.flatMap((r) =>
        CONSENSUS_OPTIONS.map((k) =>
          scoreDesign({ consistency: c.value, replication: r.value, consensus: k.value }),
        ),
      ),
    ),
  );
  const passed = score === bestScore;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick a consistency model, replication strategy, and consensus protocol that score the{" "}
          <strong>single best</strong> combined total for this scenario (huge write volume, cheap staleness, no
          Byzantine participants, availability-during-partition required) — not just one that clears the{" "}
          {PASS_THRESHOLD}-point pass bar, the actual best of all 27 combinations.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a combination to score it"
    >
      <div className={styles.controls}>
        <AxisPicker
          label="consistency"
          options={CONSISTENCY_OPTIONS}
          value={consistency}
          onChange={(v) => {
            setHasInteracted(true);
            setConsistency(v);
          }}
        />
        <AxisPicker
          label="replication"
          options={REPLICATION_OPTIONS}
          value={replication}
          onChange={(v) => {
            setHasInteracted(true);
            setReplication(v);
          }}
        />
        <AxisPicker
          label="consensus"
          options={CONSENSUS_OPTIONS}
          value={consensus}
          onChange={(v) => {
            setHasInteracted(true);
            setConsensus(v);
          }}
        />
      </div>
      <ScoreBreakdown design={design} />
      <p className={styles.controls}>
        {passed ? `best possible score (${bestScore})` : `${score} of ${bestScore} — not the best combination yet`}
      </p>
    </CheckpointFrame>
  );
}
