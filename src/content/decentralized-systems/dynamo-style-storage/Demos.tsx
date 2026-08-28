"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  PREF_LIST,
  N,
  incrementClock,
  mergeClocks,
  compareClocks,
  quorumOverlap,
  sufficientQuorum,
  writeTargets,
  type VectorClock,
} from "@/lib/math-core/dynamo-style-storage";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./DynamoControls.module.css";

const CONCEPT_ID = "dynamo-style-storage";
const WRITE_SET = PREF_LIST.slice(0, 3); // N1, N2, N3 — fixed write quorum, W=3

function clockLabel(clock: VectorClock): string {
  const entries = Object.entries(clock);
  return entries.length === 0 ? "{}" : entries.map(([k, v]) => `${k}:${v}`).join("  ");
}

function verdictClass(verdict: string): string {
  if (verdict === "concurrent") return styles.verdictConcurrent;
  if (verdict === "equal") return styles.verdictResolved;
  return styles.verdict;
}

/** Intuition beat: two nodes write independently, producing a concurrent conflict, then sync to resolve it. */
export function IntuitionDemo() {
  const [clockA, setClockA] = useState<VectorClock>({});
  const [clockB, setClockB] = useState<VectorClock>({});
  const verdict = compareClocks(clockA, clockB);

  return (
    <>
      <div className={styles.clockPanel}>
        <div className={styles.clockColumn}>
          <span className={styles.clockTitle}>Node A&apos;s clock</span>
          <span className={styles.clockSlots}>{clockLabel(clockA)}</span>
        </div>
        <div className={verdictClass(verdict)}>{verdict}</div>
        <div className={styles.clockColumn}>
          <span className={styles.clockTitle}>Node B&apos;s clock</span>
          <span className={styles.clockSlots}>{clockLabel(clockB)}</span>
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.button} onClick={() => setClockA(incrementClock(clockA, "A"))}>
            A writes
          </button>
          <button type="button" className={styles.button} onClick={() => setClockB(incrementClock(clockB, "B"))}>
            B writes
          </button>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              const merged = mergeClocks(clockA, clockB);
              setClockA(merged);
              setClockB(merged);
            }}
          >
            Sync (read-repair)
          </button>
        </div>
      </div>
    </>
  );
}

/** Play beat: a tunable sloppy-quorum read size R against a fixed write quorum, plus hinted handoff around a down node. */
export function PlayDemo() {
  const [r, setR] = useState(3);
  const [n2Down, setN2Down] = useState(false);

  const readSet = PREF_LIST.slice(N - r); // last R of the preference list
  const overlap = quorumOverlap(readSet, WRITE_SET);
  const bars = PREF_LIST.map((node) => ({
    label: node,
    value: (WRITE_SET.includes(node) ? 1 : 0) + (readSet.includes(node) ? 1 : 0),
  }));

  const handoff = writeTargets(PREF_LIST, n2Down ? new Set(["N2"]) : new Set(), 3);

  return (
    <>
      <ContributionBars
        items={bars}
        max={2}
        formatValue={(v) => String(v)}
        readout={`W={${WRITE_SET.join(",")}}, R={${readSet.join(",")}} — overlap: ${overlap.length === 0 ? "none" : overlap.join(", ")}`}
      />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          R (read quorum size)
          <input type="range" min={1} max={5} step={1} value={r} onChange={(e) => setR(Number(e.target.value))} />
          <span className={styles.sliderValue}>{r}</span>
        </label>
        <div className={styles.buttons}>
          <button type="button" className={n2Down ? styles.buttonPrimary : styles.button} onClick={() => setN2Down((d) => !d)}>
            {n2Down ? "N2 is down" : "N2 is healthy"}
          </button>
        </div>
        <div>
          W=3 targets when N2 is {n2Down ? "down" : "healthy"}: {handoff.targets.join(", ")}
          {Object.keys(handoff.hintedFor).length > 0 &&
            ` — hint: ${Object.entries(handoff.hintedFor)
              .map(([holder, forNode]) => `${holder} holds a hint for ${forNode}`)
              .join(", ")}`}
        </div>
      </div>
    </>
  );
}

/** Checkpoint: pick a read quorum size R (write quorum fixed at 3) that guarantees overlap with any write quorum. */
export function DynamoCheckpoint() {
  const [r, setR] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const w = 3;
  const passed = sufficientQuorum(r, w, N);
  const readSet = PREF_LIST.slice(N - r);
  const overlap = quorumOverlap(readSet, WRITE_SET);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const bars = PREF_LIST.map((node) => ({
    label: node,
    value: (WRITE_SET.includes(node) ? 1 : 0) + (readSet.includes(node) ? 1 : 0),
  }));

  return (
    <CheckpointFrame
      instructions={
        <>
          With the write quorum fixed at <strong>W=3</strong> out of <strong>N=5</strong>, slide the read
          quorum <strong>R</strong> up until every possible read is guaranteed to overlap every possible
          write.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the R slider"
    >
      <ContributionBars
        items={bars}
        max={2}
        formatValue={(v) => String(v)}
        readout={`R=${r}, W=${w}, N=${N} — R+W ${passed ? ">" : "≤"} N — this example's overlap: ${overlap.length === 0 ? "none" : overlap.join(", ")}`}
      />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          R
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={r}
            onChange={(e) => {
              setHasInteracted(true);
              setR(Number(e.target.value));
            }}
          />
          <span className={styles.sliderValue}>{r}</span>
        </label>
      </div>
    </CheckpointFrame>
  );
}
