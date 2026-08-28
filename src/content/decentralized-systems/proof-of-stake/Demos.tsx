"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { VALIDATORS, totalStake, selectionProbability, selectLeader } from "@/lib/math-core/proof-of-stake";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "proof-of-stake";
const MAX_ROUND = 30;

function RoundSlider({ value, onChange, max = MAX_ROUND }: { value: number; onChange: (n: number) => void; max?: number }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>round = {value}</label>
      <input
        id={id}
        type="range"
        min={1}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 220 }}
      />
    </div>
  );
}

/** The 4 validators' stakes, shown as bars sized by stake — each bar's share of the total is exactly its selection probability. */
function StakeBars({ highlightId }: { highlightId?: string }) {
  return (
    <ContributionBars
      items={VALIDATORS.map((v) => ({ label: highlightId === v.id ? `${v.id} ← leader` : v.id, value: v.stake }))}
      max={totalStake()}
      formatValue={(v) => `${v} stake (${((v / totalStake()) * 100).toFixed(0)}%)`}
    />
  );
}

/** Intuition beat: slide the round number and watch a different validator get picked, roughly in proportion to stake. */
export function IntuitionDemo() {
  const [round, setRound] = useState(1);
  const leader = selectLeader(round);
  return (
    <>
      <RoundSlider value={round} onChange={setRound} />
      <StakeBars highlightId={leader} />
      <p className={styles.stepCount}>
        Round {round}&apos;s leader: <strong>{leader}</strong> — a validator with{" "}
        {((selectionProbability(VALIDATORS.find((v) => v.id === leader)!) * 100)).toFixed(0)}% selection probability.
      </p>
    </>
  );
}

/** Play beat: step through rounds one at a time and watch the tally of who's been picked converge toward each validator's stake share. */
export function PlayDemo() {
  const [rounds, setRounds] = useState<number[]>([]);

  const tally = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(VALIDATORS.map((v) => [v.id, 0]));
    for (const r of rounds) counts[selectLeader(r)]++;
    return counts;
  }, [rounds]);

  const leader = rounds.length > 0 ? selectLeader(rounds[rounds.length - 1]) : null;

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setRounds([])}>
          Reset
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setRounds((r) => (r.length >= MAX_ROUND ? r : [...r, r.length + 1]))}
        >
          Run next round
        </button>
      </div>
      <ContributionBars
        items={VALIDATORS.map((v) => ({ label: v.id, value: tally[v.id] }))}
        max={Math.max(1, ...Object.values(tally))}
        formatValue={(v) => `${v} round(s) won`}
      />
      <p className={styles.stepCount}>
        {rounds.length === 0
          ? "No rounds run yet."
          : `${rounds.length} round(s) run — round ${rounds.length} picked ${leader}. Tallies should drift toward 40:30:20:10 as more rounds run.`}
      </p>
    </>
  );
}

/** Checkpoint: find a round whose leader is D — the validator with only 10% of the stake, so its rounds are rare. */
export function LeaderSelectionCheckpoint() {
  const [round, setRound] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const leader = round === null ? null : selectLeader(round);
  const passed = leader === "D";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Validator <strong>D</strong> holds only 10% of the stake, so it should win roughly 1 in 10 rounds. Slide to
          a round number (1–{MAX_ROUND}) whose leader is D.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Slide to search for a round D wins"
    >
      <RoundSlider
        value={round ?? 1}
        onChange={(n) => {
          setHasInteracted(true);
          setRound(n);
        }}
      />
      {leader !== null && <StakeBars highlightId={leader} />}
    </CheckpointFrame>
  );
}
