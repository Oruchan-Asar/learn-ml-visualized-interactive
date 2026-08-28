"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ID_BITS, SELF_ID, NODE_IDS, xorDistance, closestNodes } from "@/lib/math-core/kademlia-and-structured-p2p";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./KademliaControls.module.css";

const CONCEPT_ID = "kademlia-and-structured-p2p";
const MAX_DISTANCE = 2 ** ID_BITS - 1; // 15 — the largest possible XOR distance in a 4-bit space

function distanceItems(target: number) {
  return NODE_IDS.map((id) => ({ label: `node ${id}`, value: xorDistance(id, target) }));
}

function closestReadout(target: number, k: number) {
  return `closest ${k} to target ${target}: ${closestNodes(target, NODE_IDS, k).join(", ")}`;
}

/** Intuition beat: cycle through 3 preset targets and watch which nodes count as "closest" shift entirely. */
export function IntuitionDemo() {
  const presets = [10, 1, 14];
  const [i, setI] = useState(0);
  const target = presets[i];

  return (
    <>
      <ContributionBars items={distanceItems(target)} max={MAX_DISTANCE} formatValue={(v) => String(v)} readout={closestReadout(target, 2)} />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={() => setI((n) => (n + 1) % presets.length)}>
            Try next target id
          </button>
        </div>
        <div>self is node {SELF_ID} — distance is XOR, so bar length has nothing to do with numeric size</div>
      </div>
    </>
  );
}

/** Play beat: any target id, any k — the closest-k contact list recomputes live from XOR distance alone. */
export function PlayDemo() {
  const [target, setTarget] = useState(8);
  const [k, setK] = useState(3);

  return (
    <>
      <ContributionBars items={distanceItems(target)} max={MAX_DISTANCE} formatValue={(v) => String(v)} readout={closestReadout(target, k)} />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          target id
          <input type="range" min={0} max={MAX_DISTANCE} step={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          <span className={styles.sliderValue}>{target}</span>
        </label>
        <div className={styles.buttons}>
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" className={n === k ? styles.buttonPrimary : styles.button} onClick={() => setK(n)}>
              k = {n}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** Checkpoint: find a target id whose 2 nearest contacts are exactly nodes 0 and 3 — a direct set-match check. */
export function KademliaCheckpoint() {
  const [target, setTarget] = useState(8);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const closest = closestNodes(target, NODE_IDS, 2);
  const passed = [...closest].sort().join(",") === [0, 3].sort().join(",");

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide the target id so the <strong>2</strong> nearest contacts (by XOR distance) are exactly nodes{" "}
          <strong>0</strong> and <strong>3</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to pick a target id"
    >
      <ContributionBars
        items={distanceItems(target)}
        max={MAX_DISTANCE}
        formatValue={(v) => String(v)}
        readout={closestReadout(target, 2)}
      />
      <div className={styles.controls}>
        <label className={styles.sliderRow}>
          target id
          <input
            type="range"
            min={0}
            max={MAX_DISTANCE}
            step={1}
            value={target}
            onChange={(e) => {
              setHasInteracted(true);
              setTarget(Number(e.target.value));
            }}
          />
          <span className={styles.sliderValue}>{target}</span>
        </label>
      </div>
    </CheckpointFrame>
  );
}
