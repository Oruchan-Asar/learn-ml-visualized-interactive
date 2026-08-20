"use client";

import { useEffect, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ITEMS, DOMAIN, SEARCH_QUERIES, search, topMatch, margin } from "@/lib/math-core/capstone-image-text-search";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-image-text-search-engine";

const SHAPED_ITEMS = ITEMS.map((i) => ({ ...i, shape: i.modality === "image" ? ("square" as const) : ("circle" as const) }));

/** Intuition beat: type (pick) a search query, see the engine's top match highlighted. */
export function IntuitionDemo() {
  const [query, setQuery] = useState(SEARCH_QUERIES[0]);
  const top = topMatch(query);
  return (
    <>
      <div className={styles.buttons}>
        {SEARCH_QUERIES.map((q) => (
          <button type="button" key={q} className={q === query ? styles.buttonActive : styles.button} onClick={() => setQuery(q)}>
            {q.replace("Caption: ", "")}
          </button>
        ))}
      </div>
      <WordEmbeddingSpace
        words={SHAPED_ITEMS}
        queryLabel={query}
        nearestLabel={top.label}
        onSelectWord={setQuery}
        domain={DOMAIN}
        readout={`top match: "${top.label}" (distance ${top.d.toFixed(2)}, margin ${margin(query).toFixed(2)} over the runner-up)`}
      />
    </>
  );
}

/** Play beat: see the full ranked search results, not just the top hit. */
export function PlayDemo() {
  const [query, setQuery] = useState(SEARCH_QUERIES[1]);
  const results = search(query);
  const top = results[0];
  return (
    <>
      <div className={styles.buttons}>
        {SEARCH_QUERIES.map((q) => (
          <button type="button" key={q} className={q === query ? styles.buttonActive : styles.button} onClick={() => setQuery(q)}>
            {q.replace("Caption: ", "")}
          </button>
        ))}
      </div>
      <WordEmbeddingSpace
        words={SHAPED_ITEMS}
        queryLabel={query}
        nearestLabel={top.label}
        onSelectWord={setQuery}
        domain={DOMAIN}
        readout={`ranked: ${results.map((r) => `${r.label} (${r.d.toFixed(2)})`).join(", ")}`}
      />
    </>
  );
}

/** Checkpoint: click the image the search engine should return for a given query. */
export function CapstoneCheckpoint() {
  const targetQuery = "Caption: a bird flying";
  const [guess, setGuess] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = guess !== null && guess === topMatch(targetQuery).label;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Click the <strong>image</strong> the search engine should return for &ldquo;a bird flying.&rdquo;</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click an image to try it"
    >
      <WordEmbeddingSpace
        words={SHAPED_ITEMS}
        queryLabel={targetQuery}
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
