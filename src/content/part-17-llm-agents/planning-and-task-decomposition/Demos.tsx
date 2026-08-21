"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TASKS, DEPENDENCIES, planOrder, readyTasks, type Task } from "@/lib/math-core/planning-and-task-decomposition";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import planStyles from "./PlanTrace.module.css";

const CONCEPT_ID = "planning-and-task-decomposition";
const ORDER = planOrder();

/** Intuition beat: execute tasks one at a time, only ever offering ones whose dependencies are already done. */
export function IntuitionDemo() {
  const [completed, setCompleted] = useState<Task[]>([]);
  const ready = readyTasks(completed);

  return (
    <>
      <div className={planStyles.list}>
        {TASKS.map((task) => (
          <div key={task} className={completed.includes(task) ? planStyles.done : ready.includes(task) ? planStyles.ready : planStyles.blocked}>
            {task}
            {DEPENDENCIES[task].length > 0 && <span className={planStyles.deps}> — needs: {DEPENDENCIES[task].join(", ")}</span>}
          </div>
        ))}
      </div>
      <div className={styles.buttons}>
        {ready.map((task) => (
          <button key={task} type="button" className={styles.button} onClick={() => setCompleted((prev) => [...prev, task])}>
            Execute {task.slice(0, 2)}
          </button>
        ))}
        <button type="button" className={styles.button} onClick={() => setCompleted([])}>
          Reset
        </button>
      </div>
    </>
  );
}

/** Play beat: the full deterministic plan order, computed once — every task after everything it depends on. */
export function PlayDemo() {
  return (
    <div className={planStyles.list}>
      {ORDER.map((task, i) => (
        <div key={task} className={planStyles.done}>
          {i + 1}. {task}
        </div>
      ))}
    </div>
  );
}

/** Checkpoint: find which of four candidate tasks executes LAST in the plan order. */
export function PlanningCheckpoint() {
  const candidates: Task[] = ["B: boil water", "C: toast bread", "D: steep tea", "E: butter toast"];
  const [chosen, setChosen] = useState<Task | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const latestIndex = Math.max(...candidates.map((t) => ORDER.indexOf(t)));
  const chosenIndex = chosen === null ? null : ORDER.indexOf(chosen);
  const passed = chosenIndex !== null && chosenIndex === latestIndex;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the task, among the four candidates, that executes <strong>last</strong> in the plan order.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a task to try it"
    >
      <div className={styles.buttons}>
        {candidates.map((task) => (
          <button
            key={task}
            type="button"
            className={task === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(task);
            }}
          >
            {task}
          </button>
        ))}
      </div>
      {chosenIndex !== null && <p className={planStyles.deps}>Position {chosenIndex + 1} of {ORDER.length} in the plan.</p>}
    </CheckpointFrame>
  );
}
