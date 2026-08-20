"use client";

import { useEffect, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  WORDS,
  DOMAIN,
  findWord,
  nearestNeighbor,
  distance,
  analogy,
  nearestWordToPoint,
  ANALOGY_A,
  ANALOGY_B,
  ANALOGY_C,
  ANALOGY_ANSWER,
} from "@/lib/math-core/word-embeddings";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "word-embeddings";

/** Intuition beat: click any word, see which other word sits closest to it in the space. */
export function IntuitionDemo() {
  const [query, setQuery] = useState("king");
  const queryWord = findWord(query);
  const nearest = nearestNeighbor(queryWord);
  return (
    <>
      <WordEmbeddingSpace
        words={WORDS}
        queryLabel={query}
        nearestLabel={nearest.label}
        onSelectWord={setQuery}
        domain={DOMAIN}
        readout={`nearest to "${query}" is "${nearest.label}" — distance ${distance(queryWord, nearest).toFixed(2)}`}
      />
    </>
  );
}

/** Play beat: click around the space — notice distance tracks meaning (royalty, gender), not word length or spelling. */
export function PlayDemo() {
  const [query, setQuery] = useState("queen");
  const queryWord = findWord(query);
  const nearest = nearestNeighbor(queryWord);
  const ranked = WORDS.filter((w) => w.label !== query)
    .map((w) => ({ label: w.label, d: distance(queryWord, w) }))
    .sort((a, b) => a.d - b.d);
  return (
    <>
      <WordEmbeddingSpace
        words={WORDS}
        queryLabel={query}
        nearestLabel={nearest.label}
        onSelectWord={setQuery}
        domain={DOMAIN}
        readout={`ranked by distance from "${query}": ${ranked.map((r) => `${r.label} (${r.d.toFixed(2)})`).join(", ")}`}
      />
    </>
  );
}

/** Checkpoint: king - man + woman lands on a point (marked ×) — click the word you think it's closest to. */
export function WordEmbeddingCheckpoint() {
  const [guess, setGuess] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const result = analogy(findWord(ANALOGY_A), findWord(ANALOGY_B), findWord(ANALOGY_C));
  const trueNearest = nearestWordToPoint(result);

  const passed = guess === ANALOGY_ANSWER && guess === trueNearest.label;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          The × marks <strong>{ANALOGY_A}</strong> &minus; <strong>{ANALOGY_B}</strong> + <strong>{ANALOGY_C}</strong>.
          Click the word you think it lands closest to.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a word to try it"
    >
      <WordEmbeddingSpace
        words={WORDS}
        queryLabel={passed ? null : guess}
        nearestLabel={passed ? guess : null}
        extraPoint={{ x: result.x, y: result.y, label: "?" }}
        onSelectWord={(label) => {
          setHasInteracted(true);
          setGuess(label);
        }}
        domain={DOMAIN}
        readout={guess ? `you picked "${guess}"` : "click a word"}
      />
    </CheckpointFrame>
  );
}
