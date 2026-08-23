"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  ARMS,
  policy,
  fitKTO,
  KTO_EXAMPLES,
  fitSimPO,
  RESPONSE_LENGTHS,
  COMPARISONS,
  type Arm,
} from "@/lib/math-core/advanced-preference-kto-simpo";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "advanced-preference-kto-simpo";
const KTO_TRACE = fitKTO();
const SIMPO_TRACE = fitSimPO();

/** Intuition beat: step through KTO's 6 unpaired examples — derived from the SAME 3 comparisons DPO used, but no pairing survives. */
export function IntuitionDemo() {
  const [step, setStep] = useState(0);
  const theta = KTO_TRACE[step];
  const pi = policy(theta);
  const example = step === 0 ? null : KTO_EXAMPLES[step - 1];

  return (
    <>
      <ContributionBars items={ARMS.map((a) => ({ label: `π(${a})`, value: pi[a] }))} formatValue={(v) => v.toFixed(3)} readout={example ? `after "${example.arm} is ${example.desirable ? "desirable" : "undesirable"}" — a single unpaired judgment` : "before any examples"} />
      <div className={styles.buttons}>
        <button type="button" className={styles.buttonActive} onClick={() => setStep((s) => Math.min(KTO_TRACE.length - 1, s + 1))} disabled={step >= KTO_TRACE.length - 1}>
          Apply next example
        </button>
        <button type="button" className={styles.button} onClick={() => setStep(0)}>
          Reset
        </button>
      </div>
    </>
  );
}

/** Play beat: DPO's paired update vs. SimPO's reference-free, length-normalized update, on the same 3 comparisons. */
export function PlayDemo() {
  const finalKTO = policy(KTO_TRACE[KTO_TRACE.length - 1]);
  const finalSimPO = policy(SIMPO_TRACE[SIMPO_TRACE.length - 1]);

  return (
    <>
      <ContributionBars
        items={ARMS.map((a) => ({ label: `π(${a})`, value: finalKTO[a] }))}
        formatValue={(v) => v.toFixed(3)}
        readout="KTO: fit from 6 unpaired desirable/undesirable labels, no preference PAIRS used at all"
      />
      <ContributionBars
        items={ARMS.map((a) => ({ label: `π(${a})`, value: finalSimPO[a] }))}
        formatValue={(v) => v.toFixed(3)}
        readout={`SimPO: fit from the same 3 pairs as DPO, but with NO reference model — only each response's own log-prob ÷ its length (${ARMS.map((a) => `${a}:${RESPONSE_LENGTHS[a]}`).join(", ")})`}
      />
    </>
  );
}

/** Checkpoint: find which arm ends up with the LOWEST preference parameter after KTO training -- same ranking question DPO's chapter asked, different algorithm. */
export function KtoSimpoCheckpoint() {
  const [chosen, setChosen] = useState<Arm | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const finalTheta = KTO_TRACE[KTO_TRACE.length - 1];
  const minArm = ARMS.reduce((min, a) => (finalTheta[a] < finalTheta[min] ? a : min), ARMS[0]);
  const passed = chosen !== null && chosen === minArm;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>After KTO training on the 6 unpaired examples derived from {COMPARISONS.length} comparisons, find the arm with the <strong>lowest</strong> preference parameter.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an arm to try it"
    >
      <div className={styles.buttons}>
        {ARMS.map((a) => (
          <button
            key={a}
            type="button"
            className={a === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(a);
            }}
          >
            {a}
          </button>
        ))}
      </div>
      {chosen !== null && <ContributionBars items={[{ label: `theta(${chosen})`, value: finalTheta[chosen] }]} formatValue={(v) => v.toFixed(4)} />}
    </CheckpointFrame>
  );
}
