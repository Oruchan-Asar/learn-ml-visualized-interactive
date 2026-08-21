"use client";

import { useEffect, useState } from "react";
import { GraphPlayground } from "@/components/viz/GraphPlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { NODES, EDGES } from "@/lib/math-core/graphs-as-data";
import {
  initialFeatureMap,
  attentionSet,
  attentionWeights,
  edgeWeightsForFocus,
  aggregateRound,
  divergenceFromGCN,
} from "@/lib/math-core/graph-attention-networks";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "graph-attention-networks";
const FEATURES = initialFeatureMap();
const VIZ_NODES = NODES.map((n) => ({ ...n, value: FEATURES[n.id] }));

/** Intuition beat: click a node and see its own attention weight over every member of its neighborhood, drawn as edge thickness. */
export function IntuitionDemo() {
  const [selected, setSelected] = useState<string | null>("1");
  const weights = selected ? attentionWeights(selected, FEATURES) : null;
  const edgeWeights = selected ? edgeWeightsForFocus(selected, FEATURES) : {};

  return (
    <GraphPlayground
      nodes={VIZ_NODES}
      edges={EDGES}
      focusNodeId={selected}
      highlightedNodeIds={selected ? attentionSet(selected).filter((id) => id !== selected) : []}
      edgeWeights={edgeWeights}
      onSelectNode={setSelected}
      readout={
        selected && weights
          ? attentionSet(selected)
              .map((j) => `${j === selected ? "self" : `node ${j}`}=${weights[j].toFixed(2)}`)
              .join(", ")
          : "click a node"
      }
    />
  );
}

/** Play beat: every node's GAT update compared to what GCN's flat average would have given it, on the same graph. */
export function PlayDemo() {
  const divergence = divergenceFromGCN(FEATURES);
  return (
    <ContributionBars
      items={NODES.map((n) => ({ label: `node ${n.id}`, value: divergence[n.id] }))}
      formatValue={(v) => v.toFixed(3)}
      readout="positive = attention pulled the update higher than GCN's flat mean would — largest for node 4, whose one neighbor's feature sits far above its own"
    />
  );
}

/** Checkpoint: click through the nodes and find the one whose GAT update diverges furthest from GCN's flat average. */
export function AttentionCheckpoint() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const divergence = divergenceFromGCN(FEATURES);
  const maxAbs = Math.max(...NODES.map((n) => Math.abs(divergence[n.id])));
  const selectedDivergence = selected ? divergence[selected] : null;
  const passed = selected !== null && Math.abs(divergence[selected]) === maxAbs;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const gatRound1 = aggregateRound(FEATURES);

  return (
    <CheckpointFrame
      instructions={
        <>
          Click through the nodes and find the one whose GAT update diverges <strong>furthest</strong>{" "}
          from what GCN&apos;s flat average would give it.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a node to compare"
    >
      <GraphPlayground
        nodes={NODES.map((n) => ({ ...n, value: gatRound1[n.id] }))}
        edges={EDGES}
        focusNodeId={selected}
        onSelectNode={(id) => {
          setHasInteracted(true);
          setSelected(id);
        }}
        passed={passed}
        readout={selectedDivergence !== null ? `GAT − GCN for node ${selected} = ${selectedDivergence.toFixed(3)}` : "click a node"}
      />
    </CheckpointFrame>
  );
}
