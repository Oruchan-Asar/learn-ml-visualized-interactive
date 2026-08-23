"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  PERMISSIONS,
  NONE_GRANTED,
  ALL_GRANTED,
  MINIMAL_BLAST_RADIUS,
  MAX_BLAST_RADIUS,
  blastRadius,
  taskSucceeds,
  isMinimal,
  type PermissionState,
} from "@/lib/math-core/agent-sandboxing-and-security";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import toggleStyles from "./PermissionToggles.module.css";

const CONCEPT_ID = "agent-sandboxing-and-security";

function contributionItems(state: PermissionState) {
  return PERMISSIONS.map((p) => ({ label: p.label, value: state[p.id] ? p.weight : 0 }));
}

function PermissionList({ state, onToggle }: { state: PermissionState; onToggle: (id: keyof PermissionState) => void }) {
  return (
    <div className={toggleStyles.list}>
      {PERMISSIONS.map((p) => (
        <div className={toggleStyles.row} key={p.id}>
          <label>
            <input type="checkbox" checked={state[p.id]} onChange={() => onToggle(p.id)} />
            {p.label}
          </label>
          <span className={toggleStyles.weight}>weight {p.weight}</span>
        </div>
      ))}
    </div>
  );
}

/** Intuition beat: toggle permissions on and off and watch the blast radius bars grow — no task yet, just cost. */
export function IntuitionDemo() {
  const [state, setState] = useState<PermissionState>(NONE_GRANTED);
  const toggle = (id: keyof PermissionState) => setState((s) => ({ ...s, [id]: !s[id] }));

  return (
    <>
      <PermissionList state={state} onToggle={toggle} />
      <ContributionBars items={contributionItems(state)} max={MAX_BLAST_RADIUS} readout={`blast radius = ${blastRadius(state)}`} />
    </>
  );
}

/** Play beat: same toggles, now with the task's actual requirement shown — does this grant set let it succeed? */
export function PlayDemo() {
  const [state, setState] = useState<PermissionState>(ALL_GRANTED);
  const toggle = (id: keyof PermissionState) => setState((s) => ({ ...s, [id]: !s[id] }));
  const succeeds = taskSucceeds(state);

  return (
    <>
      <p className={toggleStyles.status}>Task: fetch the latest price from an API and save it to a file.</p>
      <PermissionList state={state} onToggle={toggle} />
      <ContributionBars
        items={contributionItems(state)}
        max={MAX_BLAST_RADIUS}
        readout={`blast radius = ${blastRadius(state)}  |  task ${succeeds ? "succeeds" : "fails"}${succeeds && isMinimal(state) ? "  |  minimal" : ""}`}
      />
    </>
  );
}

/** Checkpoint: find the minimal permission set — task still succeeds, blast radius as low as possible. */
export function SandboxCheckpoint() {
  const [state, setState] = useState<PermissionState>(ALL_GRANTED);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const succeeds = taskSucceeds(state);
  const passed = succeeds && blastRadius(state) === MINIMAL_BLAST_RADIUS;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const toggle = (id: keyof PermissionState) => {
    setHasInteracted(true);
    setState((s) => ({ ...s, [id]: !s[id] }));
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          Toggle permissions until the task still <strong>succeeds</strong>, with the blast radius as <strong>low</strong> as
          possible (target: {MINIMAL_BLAST_RADIUS}).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Toggle permissions to try it"
    >
      <PermissionList state={state} onToggle={toggle} />
      <ContributionBars
        items={contributionItems(state)}
        max={MAX_BLAST_RADIUS}
        readout={`blast radius = ${blastRadius(state)}  |  task ${succeeds ? "succeeds" : "fails"}`}
      />
    </CheckpointFrame>
  );
}
