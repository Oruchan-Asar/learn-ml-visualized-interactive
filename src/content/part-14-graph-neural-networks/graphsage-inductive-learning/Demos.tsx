"use client";

import { useEffect, useState } from "react";
import { GraphPlayground } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { NODES, EDGES } from "@/lib/math-core/graphs-as-data";
import { initialFeatureMap } from "@/lib/math-core/message-passing-and-gcn";
import {
  sampleNeighbors,
  sampledAggregate,
  fullAggregate,
  newNodeAggregate,
  featuresWithNewNode,
  NEW_NODE_ID,
  NEW_NODE_NEIGHBOR,
} from "@/lib/math-core/graphsage-inductive-learning";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./SageControls.module.css";

const CONCEPT_ID = "graphsage-inductive-learning";
const FEATURES = initialFeatureMap();
const VIZ_NODES = NODES.map((n) => ({ ...n, value: FEATURES[n.id] }));

/** Intuition beat: click a node and see only its SAMPLED neighbors light up, not every one it actually has. */
export function IntuitionDemo() {
  const [selected, setSelected] = useState<string | null>("1");
  const sampled = selected ? sampleNeighbors(selected) : [];
  const sampledMean = selected ? sampledAggregate(FEATURES, selected) : 0;
  const fullMean = selected ? fullAggregate(FEATURES, selected) : 0;
  return (
    <GraphPlayground
      nodes={VIZ_NODES}
      edges={EDGES}
      focusNodeId={selected}
      highlightedNodeIds={sampled}
      onSelectNode={setSelected}
      readout={
        selected
          ? `sampled {${sampled.join(", ")}} → mean ${sampledMean.toFixed(2)}  |  full neighborhood mean ${fullMean.toFixed(2)}`
          : "click a node"
      }
    />
  );
}

/** Play beat: add a brand-new node, connected to the existing graph, and apply the SAME aggregation with no retraining. */
export function PlayDemo() {
  const [showNewNode, setShowNewNode] = useState(false);
  const features = showNewNode ? featuresWithNewNode() : FEATURES;
  const nodes = showNewNode
    ? [...VIZ_NODES, { id: NEW_NODE_ID, x: 30, y: 130, value: features[NEW_NODE_ID] }]
    : VIZ_NODES;
  const edges = showNewNode ? ([...EDGES, [NEW_NODE_ID, NEW_NODE_NEIGHBOR]] as [string, string][]) : EDGES;
  return (
    <>
      <GraphPlayground
        nodes={nodes}
        edges={edges}
        focusNodeId={showNewNode ? NEW_NODE_ID : null}
        highlightedNodeIds={showNewNode ? [NEW_NODE_NEIGHBOR] : []}
        readout={showNewNode ? `new node's aggregate = ${newNodeAggregate().toFixed(2)} — same formula, zero retraining` : "toggle to add a brand-new node"}
      />
      <button type="button" className={styles.button} onClick={() => setShowNewNode((v) => !v)}>
        {showNewNode ? "Remove the new node" : "Add a brand-new node"}
      </button>
    </>
  );
}

/** Checkpoint: find the one node where sampling actually changes the answer versus using every neighbor. */
export function SamplingGapCheckpoint() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const sampledMean = selected ? sampledAggregate(FEATURES, selected) : null;
  const fullMean = selected ? fullAggregate(FEATURES, selected) : null;
  const passed = sampledMean !== null && fullMean !== null && Math.abs(sampledMean - fullMean) > 0.01;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Click through the nodes until you find the one where the sampled mean and the full-neighborhood
          mean genuinely disagree — only one of them has more neighbors than the sample size of 2.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a node to compare"
    >
      <GraphPlayground
        nodes={VIZ_NODES}
        edges={EDGES}
        focusNodeId={selected}
        highlightedNodeIds={selected ? sampleNeighbors(selected) : []}
        onSelectNode={(id) => {
          setHasInteracted(true);
          setSelected(id);
        }}
        passed={passed}
        readout={
          selected
            ? `sampled mean = ${sampledMean!.toFixed(2)}  |  full mean = ${fullMean!.toFixed(2)}`
            : "click a node"
        }
      />
    </CheckpointFrame>
  );
}
