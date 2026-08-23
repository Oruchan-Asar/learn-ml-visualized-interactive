"use client";

import { useEffect, useId, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TRAJECTORY, RISKY_STEP, MAX_SAFE_RISK, needsApproval, flaggedSteps, correctlySeparates } from "@/lib/math-core/human-in-the-loop-agent-systems";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import controlStyles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import trajectoryStyles from "./RiskTrajectory.module.css";

const CONCEPT_ID = "human-in-the-loop-agent-systems";

function ThresholdSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={controlStyles.sliderRow}>
      <label htmlFor={id}>approval threshold τ = {value}</label>
      <input id={id} type="range" min={0} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** The fixed 5-step trajectory, with each action's flagged/auto-runs status at the current threshold. */
function TrajectoryList({ threshold }: { threshold: number }) {
  return (
    <div className={trajectoryStyles.list}>
      {TRAJECTORY.map((action) => {
        const flagged = needsApproval(action, threshold);
        return (
          <div className={flagged ? trajectoryStyles.rowFlagged : trajectoryStyles.rowSafe} key={action.step}>
            <span className={trajectoryStyles.step}>step {action.step}</span>
            <span className={trajectoryStyles.description}>{action.description}</span>
            <span className={trajectoryStyles.risk}>risk {action.risk}</span>
            <span className={trajectoryStyles.tag}>{flagged ? "needs approval" : "auto-runs"}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Intuition beat: drag the threshold and watch which actions in a fixed trajectory get flagged for approval. */
export function IntuitionDemo() {
  const [threshold, setThreshold] = useState(0);
  return (
    <>
      <TrajectoryList threshold={threshold} />
      <div className={controlStyles.controls}>
        <ThresholdSlider value={threshold} onChange={setThreshold} />
      </div>
    </>
  );
}

/** Play beat: same trajectory, now reporting exactly which steps are flagged and whether the split is clean. */
export function PlayDemo() {
  const [threshold, setThreshold] = useState(5);
  const flagged = flaggedSteps(threshold);
  return (
    <>
      <TrajectoryList threshold={threshold} />
      <div className={controlStyles.controls}>
        <ThresholdSlider value={threshold} onChange={setThreshold} />
      </div>
      <p className={trajectoryStyles.readout}>
        flagged steps = [{flagged.join(", ") || "none"}] —{" "}
        {correctlySeparates(threshold) ? "correctly isolates the risky step" : "not a clean split"}
      </p>
    </>
  );
}

/** Checkpoint: find a threshold that flags exactly the one truly risky action and nothing else. */
export function ApprovalCheckpoint() {
  const [threshold, setThreshold] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = correctlySeparates(threshold);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the threshold until it flags <strong>only</strong> step {RISKY_STEP} for approval — every safe action
          (risk ≤ {MAX_SAFE_RISK}) should auto-run.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the threshold to try it"
    >
      <TrajectoryList threshold={threshold} />
      <div className={controlStyles.controls}>
        <ThresholdSlider
          value={threshold}
          onChange={(v) => {
            setHasInteracted(true);
            setThreshold(v);
          }}
        />
      </div>
      <p className={trajectoryStyles.readout}>flagged steps = [{flaggedSteps(threshold).join(", ") || "none"}]</p>
    </CheckpointFrame>
  );
}
