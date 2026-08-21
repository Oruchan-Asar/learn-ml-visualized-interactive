"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { FILTER_VERSIONS, regressionResults, passesFullSuite } from "@/lib/math-core/capstone-red-team-and-patch-a-model";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import rtStyles from "./Regression.module.css";

const CONCEPT_ID = "capstone-red-team-and-patch-a-model";

/** Intuition beat: pick a filter version and run the full regression suite against it. */
export function IntuitionDemo() {
  const [versionIndex, setVersionIndex] = useState(0);
  const version = FILTER_VERSIONS[versionIndex];
  const results = regressionResults(version.triggers);

  return (
    <>
      <div className={styles.buttons}>
        {FILTER_VERSIONS.map((v, i) => (
          <button key={v.label} type="button" className={i === versionIndex ? styles.buttonActive : styles.button} onClick={() => setVersionIndex(i)}>
            {v.label}
          </button>
        ))}
      </div>
      <div className={rtStyles.trace}>
        {results.map((r) => (
          <p key={r.request.label} className={r.correct ? rtStyles.pass : rtStyles.fail}>
            {r.correct ? "✓" : "✗"} {r.request.label}
          </p>
        ))}
        <p className={passesFullSuite(version.triggers) ? rtStyles.pass : rtStyles.fail}>
          {passesFullSuite(version.triggers) ? "Passes the full suite" : "Fails the full suite"}
        </p>
      </div>
    </>
  );
}

/** Play beat: all three filter versions' full results at once — same jailbreak fixed two different ways, one of them breaking something new. */
export function PlayDemo() {
  return (
    <div className={rtStyles.trace}>
      {FILTER_VERSIONS.map((v) => {
        const results = regressionResults(v.triggers);
        const failures = results.filter((r) => !r.correct);
        return (
          <p key={v.label} className={failures.length === 0 ? rtStyles.pass : rtStyles.fail}>
            <strong>{v.label}:</strong> {failures.length === 0 ? "0 failures" : `fails on: ${failures.map((f) => f.request.label).join(", ")}`}
          </p>
        );
      })}
    </div>
  );
}

/** Checkpoint: find the filter version that passes the full regression suite. */
export function RedTeamCheckpoint() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chosenVersion = FILTER_VERSIONS.find((v) => v.label === chosen) ?? null;
  const passed = chosenVersion !== null && passesFullSuite(chosenVersion.triggers);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the filter version, among the three, that <strong>passes the full regression suite</strong> — catches the jailbreak without breaking any safe request.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a filter version to try it"
    >
      <div className={styles.buttons}>
        {FILTER_VERSIONS.map((v) => (
          <button
            key={v.label}
            type="button"
            className={v.label === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(v.label);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
      {chosenVersion && (
        <div className={rtStyles.trace}>
          {regressionResults(chosenVersion.triggers).map((r) => (
            <p key={r.request.label} className={r.correct ? rtStyles.pass : rtStyles.fail}>
              {r.correct ? "✓" : "✗"} {r.request.label}
            </p>
          ))}
        </div>
      )}
    </CheckpointFrame>
  );
}
