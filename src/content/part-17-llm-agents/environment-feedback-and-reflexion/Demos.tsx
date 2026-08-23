"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TASKS, buildTrace, attempt1Passes, attempt1Result, trueAverage, sum, type ReflexionTask } from "@/lib/math-core/environment-feedback-and-reflexion";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import traceStyles from "./ReflexionTrace.module.css";

const CONCEPT_ID = "environment-feedback-and-reflexion";

/** Step-through the fixed attempt -> feedback -> reflexion -> retry trace for one task. */
function StepThrough({ task }: { task: ReflexionTask }) {
  const [step, setStep] = useState(0);
  const trace = buildTrace(task);
  const current = trace[step];

  return (
    <div className={traceStyles.trace}>
      <p className={traceStyles.tag}>
        Step {step + 1} of {trace.length} — {current.label}
      </p>
      <p className={traceStyles.detail}>{current.detail}</p>
      <div className={traceStyles.stepNav}>
        <button type="button" className={styles.button} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Previous
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={step === trace.length - 1}
          onClick={() => setStep((s) => Math.min(trace.length - 1, s + 1))}
        >
          Next
        </button>
        <span className={traceStyles.stepCount}>task: average({task.name})</span>
      </div>
    </div>
  );
}

/** Intuition beat: click through attempt 1 (fails), the feedback it gets, the reflexion it writes, and attempt 2 (passes). */
export function IntuitionDemo() {
  return <StepThrough task={TASKS[0]} />;
}

/** Play beat: same step-through, but pick which task instance — every one of these three needs the same fix. */
export function PlayDemo() {
  const [taskIndex, setTaskIndex] = useState(1);
  const task = TASKS[taskIndex];
  return (
    <>
      <div className={styles.buttons}>
        {TASKS.slice(0, 3).map((t, i) => (
          <button key={t.name} type="button" className={i === taskIndex ? styles.buttonActive : styles.button} onClick={() => setTaskIndex(i)}>
            {t.name}
          </button>
        ))}
      </div>
      <StepThrough task={task} />
      <p className={traceStyles.readout}>
        sum = {sum(task.nums)}, len = {task.nums.length}, true average = {trueAverage(task.nums)}
      </p>
    </>
  );
}

/** Checkpoint: find the task, among all four, where attempt 1 passes despite the exact same bug still being present. */
export function ReflexionCheckpoint() {
  const [chosen, setChosen] = useState<ReflexionTask | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = chosen !== null && attempt1Passes(chosen);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Find the task, among the four, where attempt 1&rsquo;s test <strong>passes</strong> even though the exact same
          divide-by-length bug is still in the code.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a task to try it"
    >
      <div className={styles.buttons}>
        {TASKS.map((t) => (
          <button
            key={t.name}
            type="button"
            className={t === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(t);
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <p className={attempt1Passes(chosen) ? traceStyles.trapPass : traceStyles.trapFail}>
          attempt1({chosen.name}) = {attempt1Result(chosen.nums)}, true average = {trueAverage(chosen.nums)} —{" "}
          {attempt1Passes(chosen) ? "test passes, bug hidden" : "test fails, bug caught"}
        </p>
      )}
    </CheckpointFrame>
  );
}
