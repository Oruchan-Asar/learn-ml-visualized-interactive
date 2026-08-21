"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { EXAMPLES, CANDIDATES, mix, unmix } from "@/lib/math-core/mechanistic-interpretability-and-saes";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "mechanistic-interpretability-and-saes";

/** Intuition beat: pick an example and see its tangled raw activation next to the SAE's decoded, clean concept strengths. */
export function IntuitionDemo() {
  const [index, setIndex] = useState(0);
  const example = EXAMPLES[index];
  const raw = mix(example.concepts);
  const recovered = unmix(raw);

  return (
    <>
      <div className={styles.buttons}>
        {EXAMPLES.map((ex, i) => (
          <button key={ex.label} type="button" className={i === index ? styles.buttonActive : styles.button} onClick={() => setIndex(i)}>
            {ex.label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "raw neuron 1", value: raw[0] },
          { label: "raw neuron 2", value: raw[1] },
        ]}
        formatValue={(v) => v.toFixed(2)}
        readout="tangled — neither raw dimension means one clean thing on its own"
      />
      <ContributionBars
        items={[
          { label: "animal feature", value: recovered.animal },
          { label: "finance feature", value: recovered.finance },
        ]}
        formatValue={(v) => v.toFixed(2)}
        max={1}
        readout="decoded — the SAE's job, undone exactly"
      />
    </>
  );
}

/** Play beat: all three examples' decoded concepts side by side — a clean animal/finance split recovered from tangled raw numbers every time. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={EXAMPLES.flatMap((ex) => {
        const recovered = unmix(mix(ex.concepts));
        return [
          { label: `${ex.label}: animal`, value: recovered.animal },
          { label: `${ex.label}: finance`, value: recovered.finance },
        ];
      })}
      formatValue={(v) => v.toFixed(2)}
      max={1}
      readout="the ambiguous 'catfish stock tip' example decodes to a genuine 40/60 split — not an error, an accurate readout of a genuinely mixed input"
    />
  );
}

/** Checkpoint: find the candidate whose decoded concepts are animal-dominant. */
export function SAECheckpoint() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chosenCandidate = CANDIDATES.find((c) => c.label === chosen) ?? null;
  const recovered = chosenCandidate ? unmix(mix(chosenCandidate.concepts)) : null;
  const passed = recovered !== null && recovered.animal > recovered.finance;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the candidate, among the three, whose decoded concepts are <strong>animal-dominant</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a candidate to try it"
    >
      <div className={styles.buttons}>
        {CANDIDATES.map((c) => (
          <button
            key={c.label}
            type="button"
            className={c.label === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c.label);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {recovered && (
        <ContributionBars
          items={[
            { label: "animal", value: recovered.animal },
            { label: "finance", value: recovered.finance },
          ]}
          formatValue={(v) => v.toFixed(2)}
          max={1}
        />
      )}
    </CheckpointFrame>
  );
}
