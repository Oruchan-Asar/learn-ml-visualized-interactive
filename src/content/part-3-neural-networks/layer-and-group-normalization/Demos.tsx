"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  ACTIVATIONS,
  groupNormalize,
  VALID_NUM_GROUPS,
  GROUP_LABELS,
  UNIFORM_PM_ONE_TOLERANCE,
} from "@/lib/math-core/layer-and-group-normalization";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "layer-and-group-normalization";
const CHANNEL_LABELS = ["c1", "c2", "c3", "c4", "c5", "c6"];
const RAW_MAX = 3;
const NORM_MAX = 2;

function rawItems() {
  return ACTIVATIONS.map((v, i) => ({ label: CHANNEL_LABELS[i], value: v }));
}

function normalizedItems(numGroups: number) {
  const out = groupNormalize(ACTIVATIONS, numGroups);
  return out.map((v, i) => ({ label: CHANNEL_LABELS[i], value: v }));
}

function GroupButtons({ numGroups, onSelect }: { numGroups: number; onSelect: (g: number) => void }) {
  return (
    <div className={styles.buttons}>
      {VALID_NUM_GROUPS.map((g) => (
        <button
          key={g}
          type="button"
          className={g === numGroups ? styles.buttonActive : styles.button}
          onClick={() => onSelect(g)}
        >
          {GROUP_LABELS[g]}
        </button>
      ))}
    </div>
  );
}

/** Intuition beat: the same 6 raw activations, normalized as one single group (LayerNorm) — no batch involved at all. */
export function IntuitionDemo() {
  const [numGroups, setNumGroups] = useState(1);
  return (
    <>
      <ContributionBars items={rawItems()} max={RAW_MAX} readout="raw activations for this one example" />
      <ContributionBars
        items={normalizedItems(numGroups)}
        max={NORM_MAX}
        readout={`${GROUP_LABELS[numGroups]} — computed from these 6 numbers alone`}
      />
      <div className={styles.controls}>
        <GroupButtons numGroups={numGroups} onSelect={setNumGroups} />
      </div>
    </>
  );
}

/** Play beat: slide from 1 group up to 6, watching the split shrink from "all channels together" to "every channel alone". */
export function PlayDemo() {
  const [numGroups, setNumGroups] = useState(2);
  const out = groupNormalize(ACTIVATIONS, numGroups);
  const spread = Math.max(...out) - Math.min(...out);
  return (
    <>
      <ContributionBars
        items={normalizedItems(numGroups)}
        max={NORM_MAX}
        readout={`${GROUP_LABELS[numGroups]} — spread across channels: ${spread.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <GroupButtons numGroups={numGroups} onSelect={setNumGroups} />
      </div>
    </>
  );
}

/** Checkpoint: find the group size where every normalized value lands at exactly +-1. */
export function LayerGroupNormCheckpoint() {
  const [numGroups, setNumGroups] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const out = groupNormalize(ACTIVATIONS, numGroups);
  const passed = out.every((v) => Math.abs(Math.abs(v) - 1) <= UNIFORM_PM_ONE_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick the group size where every one of the 6 normalized values comes out at exactly <strong>+1 or -1</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a group size to try it"
    >
      <ContributionBars
        items={normalizedItems(numGroups)}
        max={NORM_MAX}
        readout={`${GROUP_LABELS[numGroups]} — values: ${out.map((v) => v.toFixed(2)).join(", ")}`}
      />
      <div className={styles.controls}>
        <GroupButtons
          numGroups={numGroups}
          onSelect={(g) => {
            setHasInteracted(true);
            setNumGroups(g);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
