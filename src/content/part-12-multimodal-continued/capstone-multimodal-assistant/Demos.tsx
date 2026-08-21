"use client";

import { useEffect, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ITEMS, DOMAIN, runAssistant, AUDIO_LABELS, conditionedReverse } from "@/lib/math-core/capstone-multimodal-assistant";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-multimodal-assistant";

const SHAPED_ITEMS = ITEMS.map((i) => ({
  ...i,
  shape: i.modality === "image" ? ("square" as const) : i.modality === "audio" ? ("triangle" as const) : ("circle" as const),
}));

function toCurve(noise: number[]): CurveLine {
  return { points: conditionedReverse(noise).map((s) => ({ x: s.t, y: s.value })), variant: "fitHighlight" };
}

/** Intuition beat: pick an audio input and watch it flow through retrieval, then generation. */
export function IntuitionDemo() {
  const [audioIndex, setAudioIndex] = useState(0);
  const audioLabel = AUDIO_LABELS[audioIndex];
  const result = runAssistant(audioLabel);
  return (
    <>
      <div className={styles.buttons}>
        {AUDIO_LABELS.map((label, i) => (
          <button key={label} type="button" className={i === audioIndex ? styles.buttonActive : styles.button} onClick={() => setAudioIndex(i)}>
            {label}
          </button>
        ))}
      </div>
      <WordEmbeddingSpace
        words={SHAPED_ITEMS}
        queryLabel={audioLabel}
        nearestLabel={result.retrievedCaption}
        domain={DOMAIN}
        size={440}
        readout={`retrieved: "${result.retrievedCaption}" (distance ${result.retrievalDistance.toFixed(2)})`}
      />
      <MultiCurvePlayground
        curves={[toCurve(result.noiseUsed)]}
        domain={[0, 4]}
        rangeDomain={[0, 5]}
        readout={`generated value: ${result.generatedValue.toFixed(3)} — steered by the retrieved caption's conditioning`}
      />
    </>
  );
}

/** Play beat: all three audio inputs, all the way through the pipeline, side by side. */
export function PlayDemo() {
  const results = AUDIO_LABELS.map((label) => runAssistant(label));
  return (
    <ContributionBars
      items={results.map((r) => ({ label: r.audioLabel.replace("Audio: ", ""), value: r.generatedValue }))}
      formatValue={(v) => v.toFixed(3)}
      readout="one shared starting noise, one shared embedding space, three completely different audio-to-image results"
    />
  );
}

/** Checkpoint: find the audio input whose full pipeline produces the largest generated value. */
export function AssistantCheckpoint() {
  const [audioIndex, setAudioIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const results = AUDIO_LABELS.map((label) => runAssistant(label));
  const maxValue = Math.max(...results.map((r) => r.generatedValue));
  const chosen = audioIndex === null ? null : results[audioIndex];
  const passed = chosen !== null && chosen.generatedValue === maxValue;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the audio input whose full pipeline produces the <strong>largest</strong> generated value.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an audio input to try it"
    >
      <div className={styles.buttons}>
        {AUDIO_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={i === audioIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setAudioIndex(i);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {chosen && (
        <ContributionBars
          items={[{ label: "generated value", value: chosen.generatedValue }]}
          formatValue={(v) => v.toFixed(3)}
          max={5}
          readout={`retrieved: "${chosen.retrievedCaption}"`}
        />
      )}
    </CheckpointFrame>
  );
}
