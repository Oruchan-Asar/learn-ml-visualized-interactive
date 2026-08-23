"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  OUTCOMES,
  mean,
  variance,
  covariance,
  meanContributions,
  varianceContributions,
  covarianceContributions,
} from "@/lib/math-core/expectation-variance-and-covariance";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import tableStyles from "./MomentTable.module.css";

const CONCEPT_ID = "expectation-variance-and-covariance";
const MEAN_X = mean(OUTCOMES, "x");
const MEAN_Y = mean(OUTCOMES, "y");
const VAR_X = variance(OUTCOMES, "x");
const VAR_Y = variance(OUTCOMES, "y");
const COV_XY = covariance(OUTCOMES);

function OutcomeTable() {
  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th>outcome</th>
          <th>x</th>
          <th>y</th>
          <th>p</th>
        </tr>
      </thead>
      <tbody>
        {OUTCOMES.map((o, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{o.x}</td>
            <td>{o.y}</td>
            <td>{o.p}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type MeanKey = "x" | "y";

/** Intuition beat: toggle which variable's mean you're accumulating, term by term. */
export function IntuitionDemo() {
  const [key, setKey] = useState<MeanKey>("x");
  const total = key === "x" ? MEAN_X : MEAN_Y;
  return (
    <>
      <OutcomeTable />
      <div className={styles.buttons}>
        <button type="button" className={key === "x" ? styles.buttonActive : styles.button} onClick={() => setKey("x")}>E[X]</button>
        <button type="button" className={key === "y" ? styles.buttonActive : styles.button} onClick={() => setKey("y")}>E[Y]</button>
      </div>
      <ContributionBars
        items={meanContributions(OUTCOMES, key)}
        formatValue={(v) => v.toFixed(2)}
        readout={`E[${key.toUpperCase()}] = sum of bars = ${total.toFixed(2)}`}
      />
    </>
  );
}

type StatMode = "varX" | "varY" | "cov";

/** Play beat: toggle among Var(X), Var(Y), and Cov(X,Y), each as a live per-outcome breakdown. */
export function PlayDemo() {
  const [mode, setMode] = useState<StatMode>("varX");
  const items =
    mode === "varX"
      ? varianceContributions(OUTCOMES, "x")
      : mode === "varY"
        ? varianceContributions(OUTCOMES, "y")
        : covarianceContributions(OUTCOMES);
  const total = mode === "varX" ? VAR_X : mode === "varY" ? VAR_Y : COV_XY;
  const label = mode === "varX" ? "Var(X)" : mode === "varY" ? "Var(Y)" : "Cov(X, Y)";
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={mode === "varX" ? styles.buttonActive : styles.button} onClick={() => setMode("varX")}>Var(X)</button>
        <button type="button" className={mode === "varY" ? styles.buttonActive : styles.button} onClick={() => setMode("varY")}>Var(Y)</button>
        <button type="button" className={mode === "cov" ? styles.buttonActive : styles.button} onClick={() => setMode("cov")}>Cov(X, Y)</button>
      </div>
      <ContributionBars
        items={items}
        formatValue={(v) => v.toFixed(3)}
        readout={`${label} = sum of bars = ${total.toFixed(3)}`}
      />
    </>
  );
}

const CANDIDATES = [1.81, 2.7, 1.4, 7.29];

/** Checkpoint: compute Var(Y) by hand from the same table used throughout the chapter. */
export function MomentsCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen !== null && Math.abs(chosen - VAR_Y) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Using the same outcome table, compute <strong>Var(Y)</strong> by hand.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <OutcomeTable />
      <div className={tableStyles.candidateList}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? tableStyles.candidateActive : tableStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
