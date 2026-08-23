"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { GROUP_A, GROUP_B, rewardsOf, groupMean, groupStd, groupAdvantage, type Sample } from "@/lib/math-core/group-relative-policy-optimization-grpo";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "group-relative-policy-optimization-grpo";

function rewardBars(group: Sample[]) {
  return group.map((s) => ({ label: `response ${s.id}`, value: s.reward }));
}

function advantageBars(group: Sample[]) {
  const advantages = groupAdvantage(rewardsOf(group));
  return group.map((s, i) => ({ label: `response ${s.id}`, value: advantages[i] }));
}

/** Intuition beat: toggle between raw group rewards and their group-relative advantages — no critic network computed either bar. */
export function IntuitionDemo() {
  const [showAdvantage, setShowAdvantage] = useState(false);
  const rewards = rewardsOf(GROUP_A);
  const mean = groupMean(rewards);
  const std = groupStd(rewards);

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!showAdvantage ? styles.buttonActive : styles.button} onClick={() => setShowAdvantage(false)}>
          raw rewards
        </button>
        <button type="button" className={showAdvantage ? styles.buttonActive : styles.button} onClick={() => setShowAdvantage(true)}>
          group advantage
        </button>
      </div>
      {showAdvantage ? (
        <ContributionBars items={advantageBars(GROUP_A)} formatValue={(v) => v.toFixed(1)} max={2} readout={`(reward − ${mean.toFixed(1)}) / ${std.toFixed(1)} — computed entirely from these 5 samples`} />
      ) : (
        <ContributionBars items={rewardBars(GROUP_A)} formatValue={(v) => v.toFixed(0)} max={1} readout={`group mean = ${mean.toFixed(1)}, group std = ${std.toFixed(1)}`} />
      )}
    </>
  );
}

/** Play beat: the SAME advantage formula applied to two different groups — an easy problem (most responses correct) and a hard one (almost none are). */
export function PlayDemo() {
  return (
    <>
      <ContributionBars items={advantageBars(GROUP_A)} formatValue={(v) => v.toFixed(1)} max={2} readout="easy problem: 4 of 5 correct — being the ONE wrong response is heavily penalized" />
      <ContributionBars items={advantageBars(GROUP_B)} formatValue={(v) => v.toFixed(1)} max={2} readout="hard problem: 1 of 5 correct — being the ONE right response is heavily rewarded" />
    </>
  );
}

/** Checkpoint: find which of GROUP_B's five responses gets the largest (most positive) advantage. */
export function GrpoCheckpoint() {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const advantages = groupAdvantage(rewardsOf(GROUP_B));
  const chosenIndex = GROUP_B.findIndex((s) => s.id === chosenId);
  const chosenAdvantage = chosenIndex === -1 ? null : advantages[chosenIndex];
  const maxAdvantage = Math.max(...advantages);
  const passed = chosenAdvantage !== null && withinTolerance(chosenAdvantage, maxAdvantage, 1e-6);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>For the hard-problem group, find the response with the <strong>largest</strong> group-relative advantage.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a response to try it"
    >
      <div className={styles.buttons}>
        {GROUP_B.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === chosenId ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosenId(s.id);
            }}
          >
            response {s.id} (reward {s.reward})
          </button>
        ))}
      </div>
      {chosenAdvantage !== null && <ContributionBars items={[{ label: `response ${chosenId}`, value: chosenAdvantage }]} formatValue={(v) => v.toFixed(2)} max={2} />}
    </CheckpointFrame>
  );
}
