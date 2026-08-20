"use client";

import { useEffect, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ITEMS, DOMAIN, findItem, nearestOfOtherModality, distance } from "@/lib/math-core/joint-embedding-spaces";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "joint-embedding-spaces";

const SHAPED_ITEMS = ITEMS.map((i) => ({ ...i, shape: i.modality === "image" ? ("square" as const) : ("circle" as const) }));

/** Intuition beat: click any item (square = image, circle = caption), see its nearest match across modalities. */
export function IntuitionDemo() {
  const [query, setQuery] = useState("Image: dog");
  const queryItem = findItem(query);
  const nearest = nearestOfOtherModality(queryItem);
  return (
    <WordEmbeddingSpace
      words={SHAPED_ITEMS}
      queryLabel={query}
      nearestLabel={nearest.label}
      onSelectWord={setQuery}
      domain={DOMAIN}
      readout={`nearest cross-modal match: "${nearest.label}" — distance ${distance(queryItem, nearest).toFixed(2)}`}
    />
  );
}

/** Play beat: click through every item and see the same cross-modal pairing hold in both directions. */
export function PlayDemo() {
  const [query, setQuery] = useState("Caption: a bird flying");
  const queryItem = findItem(query);
  const nearest = nearestOfOtherModality(queryItem);
  const ranked = ITEMS.filter((i) => i.modality !== queryItem.modality)
    .map((i) => ({ label: i.label, d: distance(queryItem, i) }))
    .sort((a, b) => a.d - b.d);
  return (
    <WordEmbeddingSpace
      words={SHAPED_ITEMS}
      queryLabel={query}
      nearestLabel={nearest.label}
      onSelectWord={setQuery}
      domain={DOMAIN}
      readout={`ranked matches for "${query}": ${ranked.map((r) => `${r.label} (${r.d.toFixed(2)})`).join(", ")}`}
    />
  );
}

/** Checkpoint: click the image whose embedding is nearest to a given caption. */
export function JointEmbeddingCheckpoint() {
  const target = findItem("Caption: a cat sleeping");
  const [guess, setGuess] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = guess !== null && findItem(guess).label === nearestOfOtherModality(target).label;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Click the <strong>image</strong> whose embedding sits nearest to the caption &ldquo;a cat sleeping.&rdquo;</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click an image to try it"
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
        readout={guess ? `you picked "${guess}"` : "click an image"}
      />
    </CheckpointFrame>
  );
}
