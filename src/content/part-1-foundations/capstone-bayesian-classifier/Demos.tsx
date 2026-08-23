"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  VOCAB,
  TRAINING,
  NEW_MESSAGE,
  type Estimator,
  type Word,
  prior,
  likelihoodMLE,
  likelihoodMAP,
  classify,
} from "@/lib/math-core/capstone-bayesian-classifier";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import tableStyles from "./WordTable.module.css";

const CONCEPT_ID = "capstone-bayesian-classifier";

function likelihoodOf(word: Word, label: "spam" | "not spam", estimator: Estimator): number {
  return estimator === "map" ? likelihoodMAP(word, label) : likelihoodMLE(word, label);
}

function EstimatorPicker({ value, onChange }: { value: Estimator; onChange: (e: Estimator) => void }) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={value === "mle" ? styles.buttonActive : styles.button} onClick={() => onChange("mle")}>MLE (raw)</button>
      <button type="button" className={value === "map" ? styles.buttonActive : styles.button} onClick={() => onChange("map")}>MAP (Laplace-smoothed)</button>
    </div>
  );
}

function TrainingTable() {
  return (
    <div className={tableStyles.wrap}>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>label</th>
            <th>words</th>
          </tr>
        </thead>
        <tbody>
          {TRAINING.map((m, i) => (
            <tr key={i}>
              <td>{m.label}</td>
              <td>{m.words.length > 0 ? m.words.join(", ") : "(none)"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WordLikelihoodTable({ estimator }: { estimator: Estimator }) {
  return (
    <div className={tableStyles.wrap}>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>P(word present | class)</th>
            <th>spam</th>
            <th>not spam</th>
          </tr>
        </thead>
        <tbody>
          {VOCAB.map((word) => {
            const inMessage = NEW_MESSAGE.includes(word);
            const spamP = likelihoodOf(word, "spam", estimator);
            const notSpamP = likelihoodOf(word, "not spam", estimator);
            return (
              <tr key={word}>
                <td className={inMessage ? tableStyles.wordInMessage : undefined}>{word}{inMessage ? " (in message)" : ""}</td>
                <td className={spamP === 0 ? tableStyles.zero : undefined}>{spamP.toFixed(3)}</td>
                <td className={notSpamP === 0 ? tableStyles.zero : undefined}>{notSpamP.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Intuition beat: toggle the estimator and watch two of the six word likelihoods sit at exactly zero under MLE. */
export function IntuitionDemo() {
  const [estimator, setEstimator] = useState<Estimator>("mle");
  return (
    <>
      <TrainingTable />
      <EstimatorPicker value={estimator} onChange={setEstimator} />
      <WordLikelihoodTable estimator={estimator} />
    </>
  );
}

/** Play beat: full pipeline — priors, per-class likelihood, and the normalized posterior for the new message. */
export function PlayDemo() {
  const [estimator, setEstimator] = useState<Estimator>("map");
  const result = classify(NEW_MESSAGE, estimator);
  const total = result.likelihoods.spam + result.likelihoods["not spam"];
  return (
    <>
      <EstimatorPicker value={estimator} onChange={setEstimator} />
      <WordLikelihoodTable estimator={estimator} />
      <div className={tableStyles.readout}>
        <p>message = [{NEW_MESSAGE.join(", ")}]</p>
        <p>prior: P(spam)={prior("spam").toFixed(2)}, P(not spam)={prior("not spam").toFixed(2)}</p>
        <p>P(message | spam)={result.likelihoods.spam.toFixed(4)}, P(message | not spam)={result.likelihoods["not spam"].toFixed(4)}</p>
        {total === 0 ? (
          <p className={tableStyles.mismatch}>Both class likelihoods are exactly 0 — the posterior is 0/0, undefined. MLE breaks down completely.</p>
        ) : (
          <ContributionBars
            items={[
              { label: "P(spam | message)", value: result.posteriors.spam },
              { label: "P(not spam | message)", value: result.posteriors["not spam"] },
            ]}
            max={1}
            formatValue={(v) => v.toFixed(3)}
            readout={`prediction: ${result.prediction}`}
          />
        )}
      </div>
    </>
  );
}

const CANDIDATES = [
  { label: "0.4", value: 0.4 },
  { label: "0.6", value: 0.6 },
  { label: "0.048", value: 0.048 },
  { label: "0.5", value: 0.5 },
];

/** Checkpoint: with MAP smoothing fixed, compute the exact posterior P(spam | message) by hand. */
export function BayesianClassifierCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const target = classify(NEW_MESSAGE, "map").posteriors.spam;
  const passed = chosen !== null && Math.abs(chosen - target) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Using MAP (Laplace-smoothed) likelihoods, what is <code>P(spam | [urgent, link])</code>?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <WordLikelihoodTable estimator="map" />
      <div className={tableStyles.candidateList}>
        {CANDIDATES.map((c) => (
          <button
            key={c.label}
            type="button"
            className={chosen === c.value ? tableStyles.candidateActive : tableStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c.value);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
