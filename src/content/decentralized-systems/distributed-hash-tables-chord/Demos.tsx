"use client";

import { useEffect, useState } from "react";
import { RingDiagram } from "../consistent-hashing/RingDiagram";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { NODES } from "@/lib/math-core/consistent-hashing";
import { RING_SIZE, NODE_POSITIONS, chordLookup } from "@/lib/math-core/distributed-hash-tables-chord";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../consistent-hashing/RingControls.module.css";

const CONCEPT_ID = "distributed-hash-tables-chord";

// The same 4 nodes (A@2, B@6, C@9, D@13) placed on the same size-16 ring as the
// consistent-hashing chapter — Chord is a lookup structure layered on top of that ring, not a
// different ring, so the node labels are reused directly rather than re-invented.
function idOf(pos: number): string {
  return NODES.find((n) => n.pos === pos)!.id;
}

function pathAndOwner(startPos: number, targetPos: number) {
  const result = chordLookup(startPos, targetPos, NODE_POSITIONS);
  const fullPath = result.path[result.path.length - 1] === result.owner ? result.path : [...result.path, result.owner];
  return { ...result, fullPath };
}

function targetKeyMarker(targetPos: number, ownerPos: number) {
  return [{ id: `key@${targetPos}`, pos: targetPos, ownerId: idOf(ownerPos) }];
}

/** Intuition beat: cycle through a few preset lookups from node A and watch the hop count vary. */
export function IntuitionDemo() {
  const presets = [5, 14, 12]; // 0 hops, 1 hop, 2 hops from A@2
  const [i, setI] = useState(0);
  const target = presets[i];
  const { fullPath, owner, hops } = pathAndOwner(2, target);

  return (
    <>
      <RingDiagram
        ringSize={RING_SIZE}
        nodes={NODES}
        keys={targetKeyMarker(target, owner)}
        highlightNodeIds={["A"]}
        path={fullPath}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={() => setI((n) => (n + 1) % presets.length)}>
            Try next lookup from A
          </button>
        </div>
        <div>
          key@{target} → owner {idOf(owner)}, resolved in <strong>{hops}</strong> hop{hops === 1 ? "" : "s"}
        </div>
      </div>
    </>
  );
}

/** Play beat: pick any start node and any target key position, watch the routed path live. */
export function PlayDemo() {
  const [startId, setStartId] = useState("A");
  const [target, setTarget] = useState(10);
  const startPos = NODES.find((n) => n.id === startId)!.pos;
  const { fullPath, owner, hops } = pathAndOwner(startPos, target);

  return (
    <>
      <RingDiagram
        ringSize={RING_SIZE}
        nodes={NODES}
        keys={targetKeyMarker(target, owner)}
        highlightNodeIds={[startId]}
        path={fullPath}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          {NODES.map((n) => (
            <button
              key={n.id}
              type="button"
              className={n.id === startId ? styles.buttonPrimary : styles.button}
              onClick={() => setStartId(n.id)}
            >
              start at {n.id}
            </button>
          ))}
        </div>
        <label className={styles.sliderRow}>
          target key
          <input type="range" min={0} max={RING_SIZE - 1} step={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          <span className={styles.sliderValue}>{target}</span>
        </label>
        <div>
          owner {idOf(owner)}, <strong>{hops}</strong> hop{hops === 1 ? "" : "s"} — path {fullPath.map(idOf).join(" → ")}
        </div>
      </div>
    </>
  );
}

/** Checkpoint: find a target key whose lookup from node A takes exactly 2 hops — a direct routing check. */
export function ChordCheckpoint() {
  const [target, setTarget] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const startPos = 2; // node A
  const { fullPath, owner, hops } = pathAndOwner(startPos, target);
  const passed = hops === 2;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide the target key so that a lookup starting at node <strong>A</strong> takes{" "}
          <strong>exactly 2 hops</strong> to resolve.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to pick a target key"
    >
      <RingDiagram
        ringSize={RING_SIZE}
        nodes={NODES}
        keys={targetKeyMarker(target, owner)}
        highlightNodeIds={["A"]}
        path={fullPath}
        passed={passed}
      />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          target key
          <input
            type="range"
            min={0}
            max={RING_SIZE - 1}
            step={1}
            value={target}
            onChange={(e) => {
              setHasInteracted(true);
              setTarget(Number(e.target.value));
            }}
          />
          <span className={styles.sliderValue}>{target}</span>
        </label>
        <div>
          owner {idOf(owner)}, resolved in <strong>{hops}</strong> hop{hops === 1 ? "" : "s"}
        </div>
      </div>
    </CheckpointFrame>
  );
}
