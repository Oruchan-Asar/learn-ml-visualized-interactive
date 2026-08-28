"use client";

import { useEffect, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  PRIMARY_LOG,
  BACKUPS,
  selectPromotionCandidate,
  writesLost,
  replicateOneStep,
  type BackupState,
} from "@/lib/math-core/primary-backup-replication";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/ConsensusStepControls.module.css";

const CONCEPT_ID = "primary-backup-replication";

const PRIMARY_NODE = { id: "primary", x: 160, y: 40 };
const BACKUP_POSITIONS: Record<string, { x: number; y: number }> = {
  B1: { x: 60, y: 170 },
  B2: { x: 160, y: 170 },
  B3: { x: 260, y: 170 },
};

function toNodeSpecs(backups: BackupState[]): GraphNodeSpec[] {
  return [
    { id: PRIMARY_NODE.id, x: PRIMARY_NODE.x, y: PRIMARY_NODE.y, value: PRIMARY_LOG.length, label: "Primary" },
    ...backups.map((b) => ({
      id: b.id,
      x: BACKUP_POSITIONS[b.id].x,
      y: BACKUP_POSITIONS[b.id].y,
      value: b.replicatedUpTo,
      label: b.id,
    })),
  ];
}

const EDGES: [string, string][] = BACKUPS.map((b) => ["primary", b.id]);

/** Intuition beat: click a backup to see how many writes would be lost if it were promoted right now. */
export function IntuitionDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = BACKUPS.find((b) => b.id === selectedId) ?? null;

  return (
    <GraphPlayground
      nodes={toNodeSpecs(BACKUPS)}
      edges={EDGES}
      focusNodeId={selectedId}
      onSelectNode={(id) => setSelectedId(id === "primary" ? null : id)}
      readout={
        selected
          ? `If ${selected.id} were promoted now: ${writesLost(PRIMARY_LOG.length, selected)} write(s) lost`
          : "Click a backup to inspect it"
      }
    />
  );
}

/** Play beat: click a backup to replicate one more write into it, watching writesLost shrink toward zero. */
export function PlayDemo() {
  const [backups, setBackups] = useState<BackupState[]>(BACKUPS);
  const candidate = selectPromotionCandidate(backups);

  const advance = (id: string) => {
    setBackups((prev) => prev.map((b) => (b.id === id ? replicateOneStep(PRIMARY_LOG.length, b) : b)));
  };

  const reset = () => setBackups(BACKUPS);

  return (
    <>
      <GraphPlayground
        nodes={toNodeSpecs(backups)}
        edges={EDGES}
        focusNodeId={candidate.id}
        onSelectNode={(id) => id !== "primary" && advance(id)}
        readout={`Best to promote: ${candidate.id} — ${writesLost(PRIMARY_LOG.length, candidate)} write(s) would be lost. Click a backup to replicate one more write into it.`}
      />
      <div className={styles.controls}>
        <button type="button" className={styles.button} onClick={reset}>
          Reset lag
        </button>
      </div>
    </>
  );
}

/** Checkpoint: pick which backup should be promoted when the primary crashes right now. */
export function PrimaryBackupCheckpoint() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const correct = selectPromotionCandidate(BACKUPS);
  const passed = selectedId === correct.id;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          The primary just crashed. Click the backup that should be <strong>promoted</strong> — the one that
          loses the fewest writes.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a backup to promote it"
    >
      <GraphPlayground
        nodes={toNodeSpecs(BACKUPS)}
        edges={EDGES}
        focusNodeId={selectedId}
        passed={passed}
        onSelectNode={(id) => {
          if (id === "primary") return;
          setHasInteracted(true);
          setSelectedId(id);
        }}
        readout={
          selectedId
            ? `Promoting ${selectedId} loses ${writesLost(
                PRIMARY_LOG.length,
                BACKUPS.find((b) => b.id === selectedId)!,
              )} write(s)`
            : "Primary log has 7 writes — click a backup"
        }
      />
    </CheckpointFrame>
  );
}
