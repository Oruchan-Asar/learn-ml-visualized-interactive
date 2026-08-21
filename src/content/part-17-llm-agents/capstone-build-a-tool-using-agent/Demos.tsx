"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { MESSAGES, QUERY_INDEX, contextWindowAt, runAgent, SCENARIOS } from "@/lib/math-core/capstone-build-a-tool-using-agent";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import agentStyles from "./AgentTrace.module.css";

const CONCEPT_ID = "capstone-build-a-tool-using-agent";

/** Intuition beat: run the full agent loop on the default scenario, one step at a time. */
export function IntuitionDemo() {
  const [stepsShown, setStepsShown] = useState(0);
  const { steps, total } = runAgent(SCENARIOS[0]);
  const windowIds = new Set(contextWindowAt(QUERY_INDEX).map((m) => m.id));

  return (
    <>
      <div className={agentStyles.trace}>
        {MESSAGES.map((m) => (
          <p key={m.id} className={windowIds.has(m.id) ? agentStyles.inWindow : agentStyles.evicted}>
            {m.text}
          </p>
        ))}
      </div>
      <div className={agentStyles.trace}>
        {steps.slice(0, stepsShown).map((s, i) => (
          <p key={i} className={agentStyles.step}>
            <strong>{s.task}:</strong> {s.detail}
          </p>
        ))}
        {stepsShown === steps.length && <p className={agentStyles.total}>Total trip cost: ${total.toFixed(2)}</p>}
      </div>
      <div className={styles.buttons}>
        <button type="button" className={styles.buttonActive} onClick={() => setStepsShown((s) => Math.min(steps.length, s + 1))} disabled={stepsShown >= steps.length}>
          Run next step
        </button>
        <button type="button" className={styles.button} onClick={() => setStepsShown(0)}>
          Reset
        </button>
      </div>
    </>
  );
}

/** Play beat: all three trip scenarios' totals, from the exact same three-step agent loop. */
export function PlayDemo() {
  return (
    <div className={agentStyles.trace}>
      {SCENARIOS.map((s) => (
        <p key={s.label} className={agentStyles.step}>
          <strong>{s.label}:</strong> €{s.flightEUR} flight at rate {s.rate} + ${s.hotelUSD} hotel = ${runAgent(s).total.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

/** Checkpoint: find the scenario whose total trip cost exceeds $600. */
export function AgentCapstoneCheckpoint() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chosenScenario = SCENARIOS.find((s) => s.label === chosen) ?? null;
  const passed = chosenScenario !== null && runAgent(chosenScenario).total > 600;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the trip scenario, among the three, whose <strong>total cost exceeds $600</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a scenario to try it"
    >
      <div className={styles.buttons}>
        {SCENARIOS.map((s) => (
          <button
            key={s.label}
            type="button"
            className={s.label === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(s.label);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {chosenScenario && <p className={agentStyles.total}>Total: ${runAgent(chosenScenario).total.toFixed(2)}</p>}
    </CheckpointFrame>
  );
}
