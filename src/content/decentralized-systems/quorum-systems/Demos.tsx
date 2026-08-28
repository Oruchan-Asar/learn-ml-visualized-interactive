"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { CLUSTER_SIZE, overlapMargin, quorumsOverlap } from "@/lib/math-core/quorum-systems";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/ConsensusStepControls.module.css";

const CONCEPT_ID = "quorum-systems";

function QuorumSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={styles.sliderRow}>
      {label}
      <input
        type="range"
        min={1}
        max={CLUSTER_SIZE}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {value}
    </label>
  );
}

function bars(r: number, w: number) {
  return [
    { label: "R (read)", value: r },
    { label: "W (write)", value: w },
    { label: "N (cluster)", value: CLUSTER_SIZE },
  ];
}

/** Intuition beat: drag R and W and watch whether they're forced to overlap, with N fixed at 5. */
export function IntuitionDemo() {
  const [r, setR] = useState(2);
  const [w, setW] = useState(2);
  const overlap = quorumsOverlap(CLUSTER_SIZE, r, w);

  return (
    <>
      <ContributionBars
        items={bars(r, w)}
        max={CLUSTER_SIZE}
        formatValue={(v) => String(v)}
        readout={overlap ? "Every read quorum meets every write quorum" : "Some read/write quorum pair could miss each other"}
      />
      <div className={styles.controls}>
        <QuorumSlider label="R" value={r} onChange={setR} />
        <QuorumSlider label="W" value={w} onChange={setW} />
      </div>
    </>
  );
}

/** Play beat: same sliders, now reading off the exact overlap margin R + W − N. */
export function PlayDemo() {
  const [r, setR] = useState(3);
  const [w, setW] = useState(3);
  const margin = overlapMargin(CLUSTER_SIZE, r, w);
  const overlap = margin > 0;

  return (
    <>
      <ContributionBars
        items={bars(r, w)}
        max={CLUSTER_SIZE}
        formatValue={(v) => String(v)}
        readout={`R + W − N = ${r} + ${w} − ${CLUSTER_SIZE} = ${margin} — ${overlap ? "overlap guaranteed" : "NOT guaranteed"}`}
      />
      <div className={styles.controls}>
        <QuorumSlider label="R" value={r} onChange={setR} />
        <QuorumSlider label="W" value={w} onChange={setW} />
      </div>
    </>
  );
}

/** Checkpoint: find R and W (N=5) that guarantee overlap while contacting as few nodes as possible. */
export function QuorumCheckpoint() {
  const [r, setR] = useState(1);
  const [w, setW] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const margin = overlapMargin(CLUSTER_SIZE, r, w);
  // Minimal-cost safe quorum: overlap guaranteed (margin > 0) with the smallest possible margin (exactly 1) —
  // any larger margin means you're contacting more nodes than the R+W>N rule requires.
  const passed = margin === 1;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          N is fixed at 5. Find R and W that <strong>guarantee overlap</strong> while contacting the{" "}
          <strong>fewest nodes possible</strong> — i.e. R + W is exactly one more than N.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag R and W to try a combination"
    >
      <ContributionBars
        items={bars(r, w)}
        max={CLUSTER_SIZE}
        formatValue={(v) => String(v)}
        readout={`R + W − N = ${margin}`}
      />
      <div className={styles.controls}>
        <QuorumSlider
          label="R"
          value={r}
          onChange={(v) => {
            setHasInteracted(true);
            setR(v);
          }}
        />
        <QuorumSlider
          label="W"
          value={w}
          onChange={(v) => {
            setHasInteracted(true);
            setW(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
