"use client";

import { useEffect, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ITEMS, DOMAIN, findItem, rankByModality, nearestOfModality, distance } from "@/lib/math-core/audio-and-speech-embeddings";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "audio-and-speech-embeddings";

const SHAPED_ITEMS = ITEMS.map((i) => ({
  ...i,
  shape: i.modality === "image" ? ("square" as const) : i.modality === "audio" ? ("triangle" as const) : ("circle" as const),
}));

const TARGET_MODALITIES = ["image", "text"] as const;

/** Intuition beat: pick an audio clip (triangle) and see which modality it retrieves — image or text. */
export function IntuitionDemo() {
  const [query, setQuery] = useState("Audio: a dog barking");
  const [targetIndex, setTargetIndex] = useState(0);
  const queryItem = findItem(query);
  const target = TARGET_MODALITIES[targetIndex];
  const nearest = nearestOfModality(queryItem, target);
  return (
    <>
      <div className={styles.buttons}>
        {TARGET_MODALITIES.map((m, i) => (
          <button key={m} type="button" className={i === targetIndex ? styles.buttonActive : styles.button} onClick={() => setTargetIndex(i)}>
            retrieve: {m}
          </button>
        ))}
      </div>
      <WordEmbeddingSpace
        words={SHAPED_ITEMS}
        queryLabel={query}
        nearestLabel={nearest.label}
        onSelectWord={setQuery}
        domain={DOMAIN}
        readout={`nearest ${target}: "${nearest.label}" — distance ${distance(queryItem, nearest).toFixed(2)}`}
      />
    </>
  );
}

/** Play beat: click through every item — squares (images), circles (captions), triangles (audio) — all cross-retrieve correctly. */
export function PlayDemo() {
  const [query, setQuery] = useState("Audio: a bird chirping");
  const queryItem = findItem(query);
  const otherModalities = (["image", "text", "audio"] as const).filter((m) => m !== queryItem.modality);
  const rankings = otherModalities.map((m) => ({ modality: m, ranked: rankByModality(queryItem, m) }));
  return (
    <WordEmbeddingSpace
      words={SHAPED_ITEMS}
      queryLabel={query}
      nearestLabel={rankings[0]?.ranked[0]?.item.label ?? null}
      onSelectWord={setQuery}
      domain={DOMAIN}
      readout={rankings.map((r) => `nearest ${r.modality}: ${r.ranked[0].item.label} (${r.ranked[0].d.toFixed(2)})`).join(" — ")}
    />
  );
}

/** Checkpoint: click the audio clip whose embedding sits nearest to a given image. */
export function AudioEmbeddingCheckpoint() {
  const target = findItem("Image: bird");
  const [guess, setGuess] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = guess !== null && guess === nearestOfModality(target, "audio").label;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Click the <strong>audio clip</strong> (triangle) whose embedding sits nearest to the bird image.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click an audio clip to try it"
    >
      <WordEmbeddingSpace
        words={SHAPED_ITEMS}
        queryLabel={target.label}
        nearestLabel={passed ? guess : null}
        onSelectWord={(label) => {
          setHasInteracted(true);
          setGuess(label);
        }}
        domain={DOMAIN}
        readout={guess ? `you picked "${guess}"` : "click an audio clip"}
      />
    </CheckpointFrame>
  );
}
