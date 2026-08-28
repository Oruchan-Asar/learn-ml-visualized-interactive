"use client";

import { useEffect, useState } from "react";
import { GraphPlayground } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  RING_SIZE,
  NODE_IDS,
  NODE_POSITIONS,
  KEY_POS,
  ownerAccordingTo,
  fullyConverged,
} from "@/lib/math-core/capstone-gossip-based-key-value-store";
import { NUM_NODES, NEIGHBORS, runGossip } from "@/lib/math-core/gossip-protocols-and-epidemic-dissemination";
import { incrementClock, mergeClocks, compareClocks, type VectorClock } from "@/lib/math-core/dynamo-style-storage";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./CapstoneControls.module.css";

const CONCEPT_ID = "capstone-gossip-based-key-value-store";

// Lay the same 8 nodes out at their actual ring positions (same angle convention as the
// consistent-hashing chapter's ring diagram: position 0 at the top, increasing clockwise) so the
// gossip graph is drawn directly on top of the ring it's spreading membership knowledge about.
const CENTER = 120;
const RADIUS = 92;
function ringXY(pos: number) {
  const theta = -Math.PI / 2 + (pos / RING_SIZE) * 2 * Math.PI;
  return { x: CENTER + RADIUS * Math.cos(theta), y: CENTER + RADIUS * Math.sin(theta) };
}

// The gossip chapter's own 8-node adjacency, turned into an edge list exactly once (i < j) —
// reused directly, not re-authored.
const EDGES: [string, string][] = [];
NEIGHBORS.forEach((neighbors, i) => {
  neighbors.forEach((j) => {
    if (i < j) EDGES.push([String(i), String(j)]);
  });
});

function vizNodes(informed: ReadonlySet<string>) {
  return NODE_IDS.map((id) => ({
    id,
    x: ringXY(NODE_POSITIONS[id]).x,
    y: ringXY(NODE_POSITIONS[id]).y,
    value: informed.has(id) ? 1 : 0,
  }));
}

function useMembershipGossip(fanout: number) {
  const [round, setRound] = useState(0);
  const history = runGossip(fanout, 8, 0); // reuses the gossip chapter's exact simulator
  const clamped = Math.min(round, history.length - 1);
  const informed = new Set(history[clamped].map(String));
  const step = () => setRound((r) => Math.min(r + 1, history.length - 1));
  const reset = () => setRound(0);
  return { round: clamped, informed, step, reset };
}

function clockLabel(clock: VectorClock): string {
  const entries = Object.entries(clock);
  return entries.length === 0 ? "{}" : entries.map(([k, v]) => `${k}:${v}`).join("  ");
}

/** Intuition beat: step gossip forward at a fixed fanout and watch each node's local ring answer flip from 0 to 8. */
export function IntuitionDemo() {
  const { round, informed, step, reset } = useMembershipGossip(2);
  const agreeCount = informed.size;

  return (
    <>
      <GraphPlayground
        nodes={vizNodes(informed)}
        edges={EDGES}
        width={CENTER * 2}
        height={CENTER * 2}
        readout={`round ${round} — key@${KEY_POS}: ${agreeCount} of ${NUM_NODES} nodes now say node 8 owns it (rest still say node 0)`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={step}>
            Gossip one round (fanout 2)
          </button>
          <button type="button" className={styles.button} onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </>
  );
}

const CLIENT_A: VectorClock = incrementClock({}, "0"); // node 0 (already informed) accepts a write locally
const CLIENT_B: VectorClock = incrementClock({}, "6"); // node 6 — the true last holdout at round 2 (fanout 2) — accepts a write locally, concurrently

/** Play beat: tune the fanout, watch full convergence happen faster, and reconcile a concurrent write made mid-flight. */
export function PlayDemo() {
  const [fanout, setFanout] = useState(2);
  const { round, informed, step, reset } = useMembershipGossip(fanout);
  const [merged, setMerged] = useState(false);
  const verdict = compareClocks(CLIENT_A, CLIENT_B);
  const resolved = mergeClocks(CLIENT_A, CLIENT_B);

  return (
    <>
      <GraphPlayground
        nodes={vizNodes(informed)}
        edges={EDGES}
        width={CENTER * 2}
        height={CENTER * 2}
        readout={`round ${round} — ${informed.size} of ${NUM_NODES} agree on key@${KEY_POS}'s owner`}
      />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          fanout
          <input
            type="range"
            min={1}
            max={3}
            step={1}
            value={fanout}
            onChange={(e) => {
              setFanout(Number(e.target.value));
              reset();
            }}
          />
          <span className={styles.sliderValue}>{fanout}</span>
        </label>
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={step}>
            Gossip one round
          </button>
          <button type="button" className={styles.button} onClick={reset}>
            Reset
          </button>
        </div>
      </div>
      <div className={styles.clockPanel}>
        <div className={styles.clockColumn}>
          <span className={styles.clockTitle}>Node 0&apos;s write (informed)</span>
          <span className={styles.clockSlots}>{clockLabel(CLIENT_A)}</span>
        </div>
        <div className={merged ? styles.verdictResolved : styles.verdictConcurrent}>{merged ? "equal" : verdict}</div>
        <div className={styles.clockColumn}>
          <span className={styles.clockTitle}>Node 6&apos;s write (stale)</span>
          <span className={styles.clockSlots}>{clockLabel(CLIENT_B)}</span>
        </div>
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.button} onClick={() => setMerged(true)}>
          Merge the two writes
        </button>
        {merged && <div>merged: {clockLabel(resolved)} — both replicas now hold the same history</div>}
      </div>
    </>
  );
}

/** Checkpoint: drive gossip forward until every one of the 8 original nodes agrees node 8 owns key@15. */
export function CapstoneCheckpoint() {
  const [fanout, setFanout] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const { round, informed, step, reset } = useMembershipGossip(fanout);
  const passed = fullyConverged(informed.size);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick a fanout and gossip forward until <strong>all {NUM_NODES}</strong> original nodes agree
          that node <strong>8</strong> — not node 0 — owns the key at position {KEY_POS}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a fanout and gossip forward"
    >
      <GraphPlayground
        nodes={vizNodes(informed)}
        edges={EDGES}
        width={CENTER * 2}
        height={CENTER * 2}
        readout={
          passed
            ? `round ${round} — all ${NUM_NODES} nodes now agree: node ${ownerAccordingTo(true)} owns key@${KEY_POS}`
            : `round ${round} — ${informed.size} say node 8, ${NUM_NODES - informed.size} still say node ${ownerAccordingTo(false)}`
        }
        passed={passed}
      />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          fanout
          <input
            type="range"
            min={1}
            max={3}
            step={1}
            value={fanout}
            onChange={(e) => {
              setHasInteracted(true);
              setFanout(Number(e.target.value));
              reset();
            }}
          />
          <span className={styles.sliderValue}>{fanout}</span>
        </label>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              setHasInteracted(true);
              step();
            }}
          >
            Gossip one round
          </button>
          <button type="button" className={styles.button} onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </CheckpointFrame>
  );
}
