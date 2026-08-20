"use client";

import { useEffect, useId, useState } from "react";
import { ForwardPassDiagram } from "@/components/viz/ForwardPassDiagram";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  LAYER,
  INPUT_LABELS,
  INPUT_DOMAIN,
  TARGET_NEURON_INDEX,
  TARGET_OUTPUT,
  relu,
  preActivation,
  layerOutputs,
} from "@/lib/math-core/forward-pass";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "the-forward-pass";
const TOLERANCE = 0.05;

function InputSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>
        {label} = {value.toFixed(1)}
      </label>
      <input
        id={id}
        type="range"
        min={INPUT_DOMAIN[0]}
        max={INPUT_DOMAIN[1]}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: drag both inputs, watch every neuron's sum and output update live, independently. */
export function IntuitionDemo() {
  const [x1, setX1] = useState(0);
  const [x2, setX2] = useState(0);
  const inputs = [x1, x2];
  const preActivations = LAYER.map((n) => preActivation(n, inputs));
  const outputs = layerOutputs(LAYER, inputs, relu);

  return (
    <>
      <ForwardPassDiagram
        inputs={inputs}
        inputLabels={INPUT_LABELS}
        neurons={LAYER}
        preActivations={preActivations}
        outputs={outputs}
        readout={`outputs: A=${outputs[0].toFixed(2)}, B=${outputs[1].toFixed(2)}, C=${outputs[2].toFixed(2)}`}
      />
      <div className={styles.controls}>
        <InputSlider label="x1" value={x1} onChange={setX1} />
        <InputSlider label="x2" value={x2} onChange={setX2} />
      </div>
    </>
  );
}

/** Play beat: same layer — notice neurons with negative sums go dead flat at 0 while others keep climbing. */
export function PlayDemo() {
  const [x1, setX1] = useState(-2);
  const [x2, setX2] = useState(2);
  const inputs = [x1, x2];
  const preActivations = LAYER.map((n) => preActivation(n, inputs));
  const outputs = layerOutputs(LAYER, inputs, relu);

  return (
    <>
      <ForwardPassDiagram
        inputs={inputs}
        inputLabels={INPUT_LABELS}
        neurons={LAYER}
        preActivations={preActivations}
        outputs={outputs}
        readout={`outputs: A=${outputs[0].toFixed(2)}, B=${outputs[1].toFixed(2)}, C=${outputs[2].toFixed(2)}`}
      />
      <div className={styles.controls}>
        <InputSlider label="x1" value={x1} onChange={setX1} />
        <InputSlider label="x2" value={x2} onChange={setX2} />
      </div>
    </>
  );
}

/** Checkpoint: drive neuron B's output to exactly the target value. */
export function ForwardPassCheckpoint() {
  const [x1, setX1] = useState(0);
  const [x2, setX2] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const inputs = [x1, x2];
  const preActivations = LAYER.map((n) => preActivation(n, inputs));
  const outputs = layerOutputs(LAYER, inputs, relu);

  const passed = withinTolerance(outputs[TARGET_NEURON_INDEX], TARGET_OUTPUT, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Set x1 and x2 so neuron <strong>{LAYER[TARGET_NEURON_INDEX].label}</strong>&rsquo;s output reaches{" "}
          <strong>{TARGET_OUTPUT}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move a slider to try it"
    >
      <ForwardPassDiagram
        inputs={inputs}
        inputLabels={INPUT_LABELS}
        neurons={LAYER}
        preActivations={preActivations}
        outputs={outputs}
        readout={`neuron ${LAYER[TARGET_NEURON_INDEX].label} output = ${outputs[TARGET_NEURON_INDEX].toFixed(2)}`}
      />
      <div className={styles.controls}>
        <InputSlider
          label="x1"
          value={x1}
          onChange={(v) => {
            setHasInteracted(true);
            setX1(v);
          }}
        />
        <InputSlider
          label="x2"
          value={x2}
          onChange={(v) => {
            setHasInteracted(true);
            setX2(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
