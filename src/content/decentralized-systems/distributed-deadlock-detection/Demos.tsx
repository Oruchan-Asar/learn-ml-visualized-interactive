"use client";

import { useEffect, useMemo, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  LOCAL_VIEWS,
  mergeWaitForGraph,
  findCycle,
  type LocalView,
  type ProcessId,
} from "@/lib/math-core/distributed-deadlock-detection";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "distributed-deadlock-detection";

const POSITIONS: Record<ProcessId, { x: number; y: number }> = {
  P1: { x: 160, y: 30 },
  P2: { x: 250, y: 100 },
  P3: { x: 70, y: 100 },
  P4: { x: 110, y: 190 },
  P5: { x: 210, y: 190 },
};

function toNodeSpecs(edges: [ProcessId, ProcessId][]): GraphNodeSpec[] {
  return (Object.keys(POSITIONS) as ProcessId[]).map((id) => ({
    id,
    x: POSITIONS[id].x,
    y: POSITIONS[id].y,
    value: edges.filter(([from]) => from === id).length,
    label: id,
  }));
}

function cycleReadout(edges: [ProcessId, ProcessId][], sourceLabel: string): { text: string; cycle: ProcessId[] | null } {
  const cycle = findCycle(edges);
  if (!cycle) {
    return { text: `${sourceLabel}: no cycle visible in this edge set.`, cycle: null };
  }
  return { text: `${sourceLabel}: cycle found — ${cycle.join(" → ")} → ${cycle[0]}.`, cycle };
}

const SITE_STAGES: { label: string; views: LocalView[] }[] = [
  { label: "Site A alone", views: [LOCAL_VIEWS[0]] },
  { label: "Site A + Site B", views: [LOCAL_VIEWS[0], LOCAL_VIEWS[1]] },
  { label: "Site A + Site B + Site C (everything merged)", views: LOCAL_VIEWS },
];

/** Intuition beat: step through what each site sees, then what merging all three reveals. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const stage = SITE_STAGES[i];
  const edges = useMemo(() => mergeWaitForGraph(stage.views), [stage]);
  const { text, cycle } = cycleReadout(edges, stage.label);

  return (
    <>
      <GraphPlayground nodes={toNodeSpecs(edges)} edges={edges} highlightedNodeIds={cycle ?? []} readout={text} height={230} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          Previous
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(SITE_STAGES.length - 1, n + 1))}
          disabled={i === SITE_STAGES.length - 1}
        >
          Next
        </button>
        <span className={styles.stepCount}>
          Step {i + 1} of {SITE_STAGES.length}
        </span>
      </div>
    </>
  );
}

const SITES: LocalView["site"][] = LOCAL_VIEWS.map((v) => v.site);

function SiteToggles({ selected, onToggle }: { selected: Set<string>; onToggle: (site: string) => void }) {
  return (
    <div className={styles.buttons}>
      {SITES.map((site) => (
        <button
          key={site}
          type="button"
          className={selected.has(site) ? styles.buttonPrimary : styles.button}
          onClick={() => onToggle(site)}
        >
          {site}: {selected.has(site) ? "included" : "excluded"}
        </button>
      ))}
    </div>
  );
}

/** Play beat: freely include/exclude each site's local view and watch when (if ever) a cycle appears. */
export function PlayDemo() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const views = LOCAL_VIEWS.filter((v) => selected.has(v.site));
  const edges = useMemo(() => mergeWaitForGraph(views), [views]);
  const { text, cycle } = cycleReadout(edges, selected.size ? `${selected.size} site(s) merged` : "No sites selected");

  const toggle = (site: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(site)) next.delete(site);
      else next.add(site);
      return next;
    });
  };

  return (
    <>
      <SiteToggles selected={selected} onToggle={toggle} />
      <GraphPlayground nodes={toNodeSpecs(edges)} edges={edges} highlightedNodeIds={cycle ?? []} readout={text} height={230} />
    </>
  );
}

/**
 * Checkpoint: toggle sites on/off until the merged graph contains a cycle. Since Site A holds only
 * P1->P2, Site B only P2->P3, and Site C only P3->P1 (plus the unrelated P4->P5), no two sites ever
 * merge into a cycle — all three are required.
 */
export function DistributedDeadlockDetectionCheckpoint() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const views = LOCAL_VIEWS.filter((v) => selected.has(v.site));
  const edges = mergeWaitForGraph(views);
  const cycle = findCycle(edges);
  const passed = cycle !== null;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const toggle = (site: string) => {
    setHasInteracted(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(site)) next.delete(site);
      else next.add(site);
      return next;
    });
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          Toggle sites on until the merged wait-for graph contains a cycle — a set of processes each
          waiting on the next, all the way back around.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a site to include its local view"
    >
      <SiteToggles selected={selected} onToggle={toggle} />
      <GraphPlayground nodes={toNodeSpecs(edges)} edges={edges} highlightedNodeIds={cycle ?? []} passed={passed} readout={cycleReadout(edges, `${selected.size} site(s) merged`).text} height={230} />
    </CheckpointFrame>
  );
}
