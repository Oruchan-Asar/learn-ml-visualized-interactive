"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { TreeFitPlayground } from "@/components/viz/TreeFitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { BOOST_POINTS, BOOST_ROUNDS, MAX_BOOST_ROUNDS, BOOST_DOMAIN, ensembleAccuracy, boostRegions } from "@/lib/math-core/boosting";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "ensembles-boosting-and-adaboost";
const TOLERANCE = 0.01;
const BEST_ACCURACY = ensembleAccuracy(BOOST_ROUNDS, MAX_BOOST_ROUNDS, BOOST_POINTS);

function useBoostAtRound(numRounds: number) {
  return useMemo(() => {
    const round = BOOST_ROUNDS[numRounds - 1];
    const weightedPoints = BOOST_POINTS.map((p, i) => ({ ...p, weight: round.weightsBefore[i] * BOOST_POINTS.length }));
    return {
      weightedPoints,
      accuracy: ensembleAccuracy(BOOST_ROUNDS, numRounds, BOOST_POINTS),
      regions: boostRegions(BOOST_ROUNDS, numRounds, BOOST_DOMAIN[0], BOOST_DOMAIN[1]),
      round,
    };
  }, [numRounds]);
}

function RoundSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>rounds = {value}</label>
      <input
        id={id}
        type="range"
        min={1}
        max={MAX_BOOST_ROUNDS}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: dot size shows each point's weight going into the current round's stump — big dots are what it's trying to fix. */
export function IntuitionDemo() {
  const [rounds, setRounds] = useState(1);
  const { weightedPoints, regions, round } = useBoostAtRound(rounds);
  return (
    <>
      <TreeFitPlayground
        trainPoints={weightedPoints}
        regions={regions}
        domain={BOOST_DOMAIN}
        readout={`Round ${rounds} — splits at x=${round.stump.threshold}, weighted error = ${round.weightedError.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <RoundSlider value={rounds} onChange={setRounds} />
      </div>
    </>
  );
}

/** Play beat: same control, with the combined ensemble's accuracy visible so far. */
export function PlayDemo() {
  const [rounds, setRounds] = useState(1);
  const { weightedPoints, regions, round, accuracy } = useBoostAtRound(rounds);
  return (
    <>
      <TreeFitPlayground
        trainPoints={weightedPoints}
        regions={regions}
        domain={BOOST_DOMAIN}
        readout={`Round ${rounds} — α = ${round.alpha.toFixed(3)}, combined accuracy = ${(accuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <RoundSlider value={rounds} onChange={setRounds} />
      </div>
    </>
  );
}

/** Checkpoint: chain enough rounds together to reach the ensemble's best combined accuracy. */
export function BoostingCheckpoint() {
  const [rounds, setRounds] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const { weightedPoints, regions, accuracy } = useBoostAtRound(rounds);

  const passed = withinTolerance(accuracy, BEST_ACCURACY, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Chain enough rounds to reach the ensemble&rsquo;s best combined accuracy —{" "}
          <strong>{(BEST_ACCURACY * 100).toFixed(0)}%</strong>. One round alone is a weak learner for a reason.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the rounds slider to try it"
    >
      <TreeFitPlayground
        trainPoints={weightedPoints}
        regions={regions}
        domain={BOOST_DOMAIN}
        readout={`Round ${rounds} — combined accuracy = ${(accuracy * 100).toFixed(0)}%`}
      />
      <div className={styles.controls}>
        <RoundSlider
          value={rounds}
          onChange={(n) => {
            setHasInteracted(true);
            setRounds(n);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
