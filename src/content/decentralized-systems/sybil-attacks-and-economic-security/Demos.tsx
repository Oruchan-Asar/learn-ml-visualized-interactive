"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TOTAL_POW_COST,
  TOTAL_STAKE_VALUE,
  MAJORITY_THRESHOLD,
  sybilCost,
  attackCost,
  powAttackCost,
  posAttackCost,
} from "@/lib/math-core/sybil-attacks-and-economic-security";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "sybil-attacks-and-economic-security";
const SECURITY_BUDGET = 500_000;

function formatDollars(v: number): string {
  return `$${Math.round(v).toLocaleString()}`;
}

/** Intuition beat: a free Sybil attack (creating 1000 fake identities) costs literally nothing, next to two resource-backed 51% attacks that cost real money. */
export function IntuitionDemo() {
  const items = [
    { label: "1000 fake identities (naive P2P)", value: sybilCost(1000) },
    { label: `51% of proof-of-work`, value: powAttackCost() },
    { label: `51% of proof-of-stake`, value: posAttackCost() },
  ];
  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <>
      <ContributionBars items={items} max={maxVal} formatValue={formatDollars} />
      <p className={styles.stepCount}>
        Identity itself is free in every case — the difference is entirely in what backs it. Fake keypairs
        cost nothing; fake hash power and fake stake don&apos;t exist, so the attacker has to buy the real
        thing.
      </p>
    </>
  );
}

/** Play beat: slide the attacker's targeted share of the network and watch the cost to acquire it under each scheme. */
export function PlayDemo() {
  const [share, setShare] = useState(0.3);
  const id = useId();

  const items = [
    { label: "proof-of-work", value: attackCost(share, TOTAL_POW_COST) },
    { label: "proof-of-stake", value: attackCost(share, TOTAL_STAKE_VALUE) },
  ];
  const maxVal = Math.max(TOTAL_STAKE_VALUE, TOTAL_POW_COST);

  return (
    <>
      <div className={styles.sliderRow}>
        <label htmlFor={id}>targeted share = {(share * 100).toFixed(0)}%</label>
        <input
          id={id}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={share}
          onChange={(e) => setShare(Number(e.target.value))}
          style={{ width: 220 }}
        />
      </div>
      <ContributionBars items={items} max={maxVal} formatValue={formatDollars} />
      <p className={styles.stepCount}>
        The cost is linear in share and independent of how the attacker packages it — one identity holding
        {" "}
        {(share * 100).toFixed(0)}% of the resource costs exactly the same as a thousand identities
        splitting it.
      </p>
    </>
  );
}

/** Checkpoint: find the minimum share of proof-of-work hash power whose acquisition cost exceeds the defender's security budget. */
export function AttackCostCheckpoint() {
  const [share, setShare] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const id = useId();

  const cost = share === null ? null : attackCost(share, TOTAL_POW_COST);
  const passed = cost !== null && cost > SECURITY_BUDGET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide the attacker&apos;s targeted share of proof-of-work hash power until acquiring it would cost
          more than the network&apos;s {formatDollars(SECURITY_BUDGET)} security budget (out of a total
          {" "}
          {formatDollars(TOTAL_POW_COST)} to control 100%).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Slide to search for the price-out point"
    >
      <div className={styles.sliderRow}>
        <label htmlFor={id}>targeted share = {share === null ? 0 : (share * 100).toFixed(0)}%</label>
        <input
          id={id}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={share ?? 0}
          onChange={(e) => {
            setHasInteracted(true);
            setShare(Number(e.target.value));
          }}
          style={{ width: 220 }}
        />
      </div>
      {cost !== null && (
        <p className={styles.stepCount}>
          Cost to acquire this share: {formatDollars(cost)}
          {share !== null && share >= MAJORITY_THRESHOLD ? " — a 51% attack, and then some." : ""}
        </p>
      )}
    </CheckpointFrame>
  );
}
