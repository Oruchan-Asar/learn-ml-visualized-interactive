"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  APPLICANTS,
  RAW_WEIGHTS,
  RISK_LABELS,
  LAMBDA_MAX,
  shrinkWeights,
  classify,
  accuracyAt,
  type Applicant,
} from "@/lib/math-core/capstone-financial-risk-scorer";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";
import cardStyles from "./ApplicantCards.module.css";

const CONCEPT_ID = "capstone-financial-risk-scorer";

function ApplicantCard({ applicant, lambda }: { applicant: Applicant; lambda: number }) {
  const weights = shrinkWeights(RAW_WEIGHTS, lambda);
  const { probabilities, predicted } = classify(weights, applicant);
  const correct = predicted === applicant.trueRisk;
  const items = RISK_LABELS.map((label, i) => ({ label, value: probabilities[i] }));
  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.header}>
        <strong>{applicant.name}</strong>
        <span>
          debt={applicant.debtRatio}, late={applicant.latePayments}
        </span>
        <span className={correct ? cardStyles.correct : cardStyles.wrong}>
          {correct ? "✓" : "✗"} predicted {RISK_LABELS[predicted]} (true: {RISK_LABELS[applicant.trueRisk]})
        </span>
      </div>
      <ContributionBars items={items} max={1} formatValue={(v) => v.toFixed(3)} />
    </div>
  );
}

function LambdaSlider({ value, onChange }: { value: number; onChange: (lambda: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>λ = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={LAMBDA_MAX}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: shrink the raw per-class weights and watch each applicant's risk classification update live. */
export function IntuitionDemo() {
  const [lambda, setLambda] = useState(0);
  const accuracy = accuracyAt(lambda);
  return (
    <>
      <div className={cardStyles.grid}>
        {APPLICANTS.map((a) => (
          <ApplicantCard key={a.name} applicant={a} lambda={lambda} />
        ))}
      </div>
      <p className={cardStyles.summary}>{accuracy} of 4 applicants correctly classified at this λ</p>
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Play beat: track average confidence in the winning class alongside accuracy — they decouple as λ grows. */
export function PlayDemo() {
  const [lambda, setLambda] = useState(1);
  const weights = shrinkWeights(RAW_WEIGHTS, lambda);
  const results = APPLICANTS.map((a) => classify(weights, a));
  const avgConfidence = results.reduce((sum, r) => sum + Math.max(...r.probabilities), 0) / results.length;
  const accuracy = accuracyAt(lambda);
  return (
    <>
      <div className={cardStyles.grid}>
        {APPLICANTS.map((a) => (
          <ApplicantCard key={a.name} applicant={a} lambda={lambda} />
        ))}
      </div>
      <p className={cardStyles.summary}>
        accuracy: {accuracy}/4 — average confidence in the winning class: {(avgConfidence * 100).toFixed(1)}%
      </p>
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

const CANDIDATES = [0.2, 0.3, 0.5, 1.0];

/** Checkpoint: find the λ (among candidates) that still classifies every applicant correctly. */
export function RiskScorerCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen !== null && accuracyAt(chosen) === 4;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Pick the λ that still classifies <strong>all 4</strong> applicants correctly.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <div className={styles.buttons}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            λ = {c.toFixed(2)}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <p className={cardStyles.summary}>{accuracyAt(chosen)} of 4 correct at λ = {chosen.toFixed(2)}</p>
      )}
    </CheckpointFrame>
  );
}
