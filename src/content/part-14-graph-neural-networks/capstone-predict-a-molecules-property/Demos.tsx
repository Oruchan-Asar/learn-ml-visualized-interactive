"use client";

import { useEffect, useState } from "react";
import { GraphPlayground } from "@/components/viz/GraphPlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { NODES } from "@/lib/math-core/graphs-as-data";
import { STRUCTURES, initialFeatures, embed, predictProperty } from "@/lib/math-core/capstone-predict-a-molecules-property";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-predict-a-molecules-property";
const FEATURES = initialFeatures();

/** Intuition beat: same six atoms, three different bond structures — watch the predicted property change with the wiring alone. */
export function IntuitionDemo() {
  const [structureIndex, setStructureIndex] = useState(0);
  const structure = STRUCTURES[structureIndex];
  const final = embed(structure.edges, FEATURES);
  const prediction = predictProperty(structure.edges, FEATURES);

  return (
    <>
      <div className={styles.buttons}>
        {STRUCTURES.map((s, i) => (
          <button key={s.label} type="button" className={i === structureIndex ? styles.buttonActive : styles.button} onClick={() => setStructureIndex(i)}>
            {s.label}
          </button>
        ))}
      </div>
      <GraphPlayground
        nodes={NODES.map((n) => ({ ...n, value: final[n.id] }))}
        edges={structure.edges}
        readout={`predicted property = ${prediction.toFixed(3)}`}
      />
    </>
  );
}

/** Play beat: all three structures' predictions side by side — same atoms, same features, three different answers. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={STRUCTURES.map((s) => ({ label: s.label, value: predictProperty(s.edges, FEATURES) }))}
      formatValue={(v) => v.toFixed(3)}
      readout="same six atoms, same starting features — every difference here comes from which atoms are bonded to which"
    />
  );
}

/** Checkpoint: find which of the three bond structures gives the HIGHEST predicted property. */
export function MoleculeCheckpoint() {
  const [structureIndex, setStructureIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const predictions = STRUCTURES.map((s) => predictProperty(s.edges, FEATURES));
  const maxPrediction = Math.max(...predictions);
  const chosen = structureIndex === null ? null : predictions[structureIndex];
  const passed = chosen !== null && chosen === maxPrediction;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the bond structure, among the three candidates, that gives the <strong>highest</strong> predicted property.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a structure to try it"
    >
      <div className={styles.buttons}>
        {STRUCTURES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            className={i === structureIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setStructureIndex(i);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {chosen !== null && <ContributionBars items={[{ label: "predicted property", value: chosen }]} formatValue={(v) => v.toFixed(3)} max={maxPrediction} />}
    </CheckpointFrame>
  );
}
