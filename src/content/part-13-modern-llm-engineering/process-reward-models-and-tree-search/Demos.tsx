"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { REASONING_TREE, allPaths, bestPath, greedyPath } from "@/lib/math-core/process-reward-models-and-tree-search";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "process-reward-models-and-tree-search";

const FIRST_STEPS = REASONING_TREE.children ?? [];

function allPathBars() {
  return FIRST_STEPS.flatMap((first) =>
    (first.children ?? []).map((second) => ({
      label: `${first.id} (${first.score}) → ${second.id} (${second.score})`,
      value: first.score * second.score,
    })),
  );
}

/** Intuition beat: step through the tree's 3 first-steps, revealing each one's children and PRM scores one at a time. */
export function IntuitionDemo() {
  const [branchIndex, setBranchIndex] = useState(0);
  const branch = FIRST_STEPS[branchIndex];
  const children = branch.children ?? [];

  return (
    <>
      <p>
        first step <strong>{branch.id}</strong> — PRM score {branch.score}
      </p>
      <ContributionBars
        items={children.map((c) => ({ label: `then ${c.id} (score ${c.score})`, value: branch.score * c.score }))}
        formatValue={(v) => v.toFixed(4)}
        max={0.5}
        readout={`path score = step 1 × step 2`}
      />
      <div className={styles.buttons}>
        {FIRST_STEPS.map((b, i) => (
          <button key={b.id} type="button" className={i === branchIndex ? styles.buttonActive : styles.button} onClick={() => setBranchIndex(i)}>
            branch {b.id}
          </button>
        ))}
      </div>
    </>
  );
}

/** Play beat: every path in the tree, scored, versus what greedy first-step selection would have found. */
export function PlayDemo() {
  const best = bestPath();
  const greedy = greedyPath();

  return (
    <>
      <ContributionBars items={allPathBars()} formatValue={(v) => v.toFixed(4)} max={0.35} readout={`every path's score — tree search picks the highest: ${best.ids.join(" → ")} = ${best.product.toFixed(4)}`} />
      <ContributionBars
        items={[
          { label: `tree search: ${best.ids.join(" → ")}`, value: best.product },
          { label: `greedy: ${greedy.ids.join(" → ")}`, value: greedy.product },
        ]}
        formatValue={(v) => v.toFixed(4)}
        max={0.35}
        readout="greedy commits to the best-LOOKING first step (A, score 0.9) and never recovers — tree search evaluates full paths instead"
      />
    </>
  );
}

/** Checkpoint: find the single best path through the whole tree — not the branch with the highest first-step score. */
export function PrmTreeSearchCheckpoint() {
  const [chosen, setChosen] = useState<[string, string] | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const target = bestPath();
  const passed = chosen !== null && chosen[0] === target.ids[0] && chosen[1] === target.ids[1];

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const paths = allPaths();

  return (
    <CheckpointFrame
      instructions={<>Find the single <strong>best-scoring</strong> path through the whole tree — it is not the branch whose first step looks most promising.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a path to try it"
    >
      <div className={styles.buttons}>
        {paths.map((p) => (
          <button
            key={p.ids.join("-")}
            type="button"
            className={chosen && chosen[0] === p.ids[0] && chosen[1] === p.ids[1] ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(p.ids);
            }}
          >
            {p.ids.join(" → ")}
          </button>
        ))}
      </div>
      {chosen && <ContributionBars items={[{ label: chosen.join(" → "), value: paths.find((p) => p.ids[0] === chosen[0] && p.ids[1] === chosen[1])!.product }]} formatValue={(v) => v.toFixed(4)} max={0.35} />}
    </CheckpointFrame>
  );
}
