"use client";

import { useEffect, useState } from "react";
import { GraphPlayground } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { runGossip, NUM_NODES, roundsToFullCoverage } from "@/lib/math-core/gossip-protocols-and-epidemic-dissemination";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./GossipControls.module.css";

const CONCEPT_ID = "gossip-protocols-and-epidemic-dissemination";

/** Fixed positions on a circle — same layout order as node id, so edges read cleanly. */
const POSITIONS: [number, number][] = [
  [150, 40],
  [227.8, 72.2],
  [260, 150],
  [227.8, 227.8],
  [150, 260],
  [72.2, 227.8],
  [40, 150],
  [72.2, 72.2],
];

const EDGES: [string, string][] = [
  ["0", "1"],
  ["1", "2"],
  ["2", "3"],
  ["3", "4"],
  ["4", "5"],
  ["5", "6"],
  ["6", "7"],
  ["7", "0"],
  ["0", "4"],
  ["1", "5"],
  ["2", "6"],
  ["3", "7"],
];

function toVizNodes(infected: Set<number>) {
  return Array.from({ length: NUM_NODES }, (_, i) => ({
    id: String(i),
    x: POSITIONS[i][0],
    y: POSITIONS[i][1],
    value: infected.has(i) ? 1 : 0,
  }));
}

function useGossipTrace(fanout: number) {
  const [round, setRound] = useState(0);
  const history = runGossip(fanout, 8); // pre-compute plenty of rounds; we just index into it
  const clampedRound = Math.min(round, history.length - 1);
  const infected = new Set(history[clampedRound]);
  const prevInfected = new Set(history[Math.max(0, clampedRound - 1)]);
  const justInfected = [...infected].filter((n) => !prevInfected.has(n)).map(String);

  const step = () => setRound((r) => Math.min(r + 1, history.length - 1));
  const reset = () => setRound(0);

  return { round: clampedRound, infected, justInfected, step, reset, atEnd: clampedRound >= history.length - 1 };
}

/** Intuition beat: step through gossip rounds at a fixed fanout and watch the infected set grow. */
export function IntuitionDemo() {
  const { round, infected, justInfected, step, reset } = useGossipTrace(2);
  return (
    <>
      <GraphPlayground
        nodes={toVizNodes(infected)}
        edges={EDGES}
        highlightedNodeIds={justInfected}
        readout={`round ${round}  —  ${infected.size} of ${NUM_NODES} nodes have heard the rumor`}
        height={300}
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

/** Play beat: fanout is now a live slider — watch rounds-to-full-coverage shrink as fanout grows. */
export function PlayDemo() {
  const [fanout, setFanout] = useState(2);
  const { round, infected, justInfected, step, reset } = useGossipTrace(fanout);
  const full = roundsToFullCoverage(fanout);

  return (
    <>
      <GraphPlayground
        nodes={toVizNodes(infected)}
        edges={EDGES}
        highlightedNodeIds={justInfected}
        readout={`round ${round}  —  ${infected.size} of ${NUM_NODES} infected  —  fanout ${fanout} reaches everyone in ${full} rounds`}
        height={300}
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
    </>
  );
}

/** Checkpoint: pick a fanout that infects the whole network within 3 rounds — a direct routing/threshold check. */
export function GossipCheckpoint() {
  const [fanout, setFanout] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const full = roundsToFullCoverage(fanout);
  const { round, infected, justInfected, step, reset } = useGossipTrace(fanout);
  // The instructions say to gossip forward and CONFIRM it — checking only the fanout parameter let a
  // student pass the instant they set fanout to 2 or 3, without ever clicking "Gossip one round." The
  // pass condition now depends on the actual simulation state: you have to run it to observe full
  // coverage arrive by round 3.
  const passed = full > 0 && full <= 3 && round <= 3 && infected.size === NUM_NODES;

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick a fanout (1, 2, or 3) so the rumor reaches all <strong>8</strong> nodes within{" "}
          <strong>3</strong> rounds, then gossip forward and confirm it.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a fanout and gossip forward"
    >
      <GraphPlayground
        nodes={toVizNodes(infected)}
        edges={EDGES}
        highlightedNodeIds={justInfected}
        readout={`round ${round}  —  ${infected.size} of ${NUM_NODES} infected  —  full coverage at round ${full}`}
        passed={passed}
        height={300}
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
