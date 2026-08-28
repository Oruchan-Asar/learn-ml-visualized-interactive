"use client";

import { useEffect, useState } from "react";
import { RingDiagram } from "./RingDiagram";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { RING_SIZE, NODES, KEYS, assignAll, reassignedKeys } from "@/lib/math-core/consistent-hashing";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./RingControls.module.css";

const CONCEPT_ID = "consistent-hashing";
const BASE_ASSIGNMENT = assignAll(NODES, KEYS);

function keysWithOwners(assignment: Record<string, string>) {
  return KEYS.map((k) => ({ ...k, ownerId: assignment[k.id] }));
}

/** Intuition beat: toggle a new node E on and off the ring, watch only one key ever move. */
export function IntuitionDemo() {
  const [added, setAdded] = useState(false);
  const nodes = added ? [...NODES, { id: "E", pos: 11 }] : NODES;
  const assignment = added ? assignAll(nodes, KEYS) : BASE_ASSIGNMENT;
  const changed = reassignedKeys(BASE_ASSIGNMENT, assignment);

  return (
    <>
      <RingDiagram ringSize={RING_SIZE} nodes={nodes} keys={keysWithOwners(assignment)} highlightNodeIds={added ? ["E"] : []} />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={() => setAdded((a) => !a)}>
            {added ? "Remove node E (pos 11)" : "Add node E at position 11"}
          </button>
        </div>
        <div>{changed.length === 0 ? "no keys reassigned" : `reassigned: ${changed.join(", ")}`}</div>
      </div>
    </>
  );
}

/** Play beat: drag the new node's position around the whole ring, watch which keys follow it. */
export function PlayDemo() {
  const [pos, setPos] = useState(11);
  const nodes = [...NODES, { id: "E", pos }];
  const assignment = assignAll(nodes, KEYS);
  const changed = reassignedKeys(BASE_ASSIGNMENT, assignment);

  return (
    <>
      <RingDiagram ringSize={RING_SIZE} nodes={nodes} keys={keysWithOwners(assignment)} highlightNodeIds={["E"]} />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          E&apos;s position
          <input type="range" min={0} max={RING_SIZE - 1} step={1} value={pos} onChange={(e) => setPos(Number(e.target.value))} />
          <span className={styles.sliderValue}>{pos}</span>
        </label>
        <div>{changed.length === 0 ? "no keys reassigned" : `reassigned: ${changed.join(", ")}`}</div>
      </div>
    </>
  );
}

/** Checkpoint: place E so exactly key k4 (and nothing else) reassigns to it — a direct, exact-match check. */
export function RingCheckpoint() {
  const [pos, setPos] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const nodes = [...NODES, { id: "E", pos }];
  const assignment = assignAll(nodes, KEYS);
  const changed = reassignedKeys(BASE_ASSIGNMENT, assignment);
  const passed = changed.length === 1 && changed[0] === "k4" && assignment.k4 === "E";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide E around the ring so that <strong>exactly key k4</strong> (and no other key) reassigns
          to it.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to place E"
    >
      <RingDiagram ringSize={RING_SIZE} nodes={nodes} keys={keysWithOwners(assignment)} highlightNodeIds={["E"]} passed={passed} />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          E&apos;s position
          <input
            type="range"
            min={0}
            max={RING_SIZE - 1}
            step={1}
            value={pos}
            onChange={(e) => {
              setHasInteracted(true);
              setPos(Number(e.target.value));
            }}
          />
          <span className={styles.sliderValue}>{pos}</span>
        </label>
        <div>{changed.length === 0 ? "no keys reassigned" : `reassigned: ${changed.join(", ")}`}</div>
      </div>
    </CheckpointFrame>
  );
}
