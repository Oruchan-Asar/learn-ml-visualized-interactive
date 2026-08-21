"use client";

import { useEffect, useState } from "react";
import { GraphPlayground } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { NODES, EDGES } from "@/lib/math-core/graphs-as-data";
import { initialFeatureMap, aggregateRound, variance, type FeatureMap } from "@/lib/math-core/message-passing-and-gcn";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./GCNControls.module.css";

const CONCEPT_ID = "message-passing-and-gcn";
const VARIANCE_TARGET = 0.2;

function toVizNodes(features: FeatureMap) {
  return NODES.map((n) => ({ ...n, value: features[n.id] }));
}

function useMessagePassing() {
  const [history, setHistory] = useState<FeatureMap[]>([initialFeatureMap()]);

  // Always derives the next round from the latest queued history via the functional updater, so
  // rapid or batched clicks each append exactly one genuinely new round — never a stale duplicate.
  const step = () => {
    setHistory((h) => [...h, aggregateRound(h[h.length - 1])]);
  };
  const reset = () => setHistory([initialFeatureMap()]);

  const round = history.length - 1;
  const current = history[round];
  return { round, current, step, reset };
}

/** Intuition beat: step through aggregation rounds and watch every node's number pull toward its neighbors'. */
export function IntuitionDemo() {
  const { round, current, step, reset } = useMessagePassing();
  return (
    <>
      <GraphPlayground
        nodes={toVizNodes(current)}
        edges={EDGES}
        readout={`round ${round}`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={step}>
            Pass one round of messages
          </button>
          <button type="button" className={styles.button} onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </>
  );
}

/** Play beat: same interaction, now also tracking variance across all node values — watch it shrink every round. */
export function PlayDemo() {
  const { round, current, step, reset } = useMessagePassing();
  const v = variance(current);
  return (
    <>
      <GraphPlayground
        nodes={toVizNodes(current)}
        edges={EDGES}
        readout={`round ${round}  —  variance across all nodes = ${v.toFixed(4)}`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={step}>
            Pass one round of messages
          </button>
          <button type="button" className={styles.button} onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </>
  );
}

/** Checkpoint: pass enough rounds of messages to smooth the graph's variance under a target — over-smoothing, on purpose. */
export function SmoothingCheckpoint() {
  const { round, current, step, reset } = useMessagePassing();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const v = variance(current);
  const passed = v < VARIANCE_TARGET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Pass rounds of messages until the variance across all six node values drops under{" "}
          <strong>{VARIANCE_TARGET}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pass a round to try it"
    >
      <GraphPlayground nodes={toVizNodes(current)} edges={EDGES} readout={`round ${round}  —  variance = ${v.toFixed(4)}`} />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              setHasInteracted(true);
              step();
            }}
          >
            Pass one round of messages
          </button>
          <button type="button" className={styles.button} onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </CheckpointFrame>
  );
}
