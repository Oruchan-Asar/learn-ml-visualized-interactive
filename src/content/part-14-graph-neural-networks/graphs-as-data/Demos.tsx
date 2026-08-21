"use client";

import { useEffect, useState } from "react";
import { GraphPlayground } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { NODES, EDGES, neighbors, degree } from "@/lib/math-core/graphs-as-data";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "graphs-as-data";

/** GraphPlayground's node shape wants `value`; math-core calls the same number `feature`. */
const VIZ_NODES = NODES.map((n) => ({ ...n, value: n.feature }));

/** Intuition beat: click any node and watch its actual neighbors light up — no fixed spatial pattern. */
export function IntuitionDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const n = selected ? neighbors(selected) : [];
  return (
    <GraphPlayground
      nodes={VIZ_NODES}
      edges={EDGES}
      focusNodeId={selected}
      highlightedNodeIds={n}
      onSelectNode={setSelected}
      readout={selected ? `node ${selected}'s neighbors: {${n.join(", ")}}` : "click a node to see its neighbors"}
    />
  );
}

/** Play beat: same interaction, now also reading off the clicked node's degree. */
export function PlayDemo() {
  const [selected, setSelected] = useState<string | null>("1");
  const n = selected ? neighbors(selected) : [];
  const d = selected ? degree(selected) : 0;
  return (
    <GraphPlayground
      nodes={VIZ_NODES}
      edges={EDGES}
      focusNodeId={selected}
      highlightedNodeIds={n}
      onSelectNode={setSelected}
      readout={selected ? `degree(${selected}) = ${d}  —  neighbors {${n.join(", ")}}` : "click a node"}
    />
  );
}

/** Checkpoint: find the two leaf nodes — degree exactly 1 — by clicking through the graph. */
export function DegreeCheckpoint() {
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = found.size >= 2;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const handleSelect = (id: string) => {
    setHasInteracted(true);
    setSelected(id);
    if (degree(id) === 1) setFound((prev) => new Set(prev).add(id));
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          Click through the nodes until you&apos;ve found both <strong>leaves</strong> — the nodes with
          degree exactly 1. Found so far: {found.size ? [...found].sort().join(", ") : "none"}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a node to check its degree"
    >
      <GraphPlayground
        nodes={VIZ_NODES}
        edges={EDGES}
        focusNodeId={selected}
        highlightedNodeIds={selected ? neighbors(selected) : []}
        onSelectNode={handleSelect}
        readout={selected ? `degree(${selected}) = ${degree(selected)}` : "click a node"}
      />
    </CheckpointFrame>
  );
}
