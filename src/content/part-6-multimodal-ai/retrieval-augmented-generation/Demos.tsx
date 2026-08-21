"use client";

import { useEffect, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { DOCS, QUERIES, DOMAIN, DEFAULT_PRIOR_ANSWER, findQuery, retrieve, generate } from "@/lib/math-core/rag";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "retrieval-augmented-generation";

const SHAPED_ITEMS = [
  ...DOCS.map((d) => ({ label: d.label, x: d.x, y: d.y, shape: "square" as const })),
  ...QUERIES.map((q) => ({ label: q.label, x: q.x, y: q.y, shape: "circle" as const })),
];

const QUERY_LABELS = new Set(QUERIES.map((q) => q.label));

/** Only the Q: circles are selectable queries — the Doc: squares are informational, not clickable targets. */
function selectQueryOnly(setQuery: (label: string) => void) {
  return (label: string) => {
    if (QUERY_LABELS.has(label)) setQuery(label);
  };
}

/** Intuition beat: click a question, see the fact it retrieves and the answer that fact grounds. */
export function IntuitionDemo() {
  const [query, setQuery] = useState("Q: capital of Japan");
  const q = findQuery(query);
  const doc = retrieve(q);
  return (
    <WordEmbeddingSpace
      words={SHAPED_ITEMS}
      queryLabel={query}
      nearestLabel={doc.label}
      onSelectWord={selectQueryOnly(setQuery)}
      domain={DOMAIN}
      size={440}
      readout={`retrieved "${doc.label}" → answer: "${doc.answer}"`}
    />
  );
}

/** Play beat: toggle retrieval on/off for the same question and watch the generated answer change. */
export function PlayDemo() {
  const [query, setQuery] = useState("Q: capital of Australia");
  const [useRetrieval, setUseRetrieval] = useState(true);
  const q = findQuery(query);
  const doc = retrieve(q);
  const answer = generate(q, useRetrieval);
  return (
    <>
      <div className={styles.buttons}>
        {QUERIES.map((item) => (
          <button type="button" key={item.label} className={item.label === query ? styles.buttonActive : styles.button} onClick={() => setQuery(item.label)}>
            {item.label.replace("Q: ", "")}
          </button>
        ))}
      </div>
      <WordEmbeddingSpace
        words={SHAPED_ITEMS}
        queryLabel={query}
        nearestLabel={useRetrieval ? doc.label : null}
        onSelectWord={selectQueryOnly(setQuery)}
        domain={DOMAIN}
        size={440}
        readout={`${useRetrieval ? "grounded" : "ungrounded"} answer: "${answer}"`}
      />
      <div className={styles.buttons}>
        <button type="button" className={!useRetrieval ? styles.buttonActive : styles.button} onClick={() => setUseRetrieval(false)}>
          No retrieval
        </button>
        <button type="button" className={useRetrieval ? styles.buttonActive : styles.button} onClick={() => setUseRetrieval(true)}>
          With retrieval
        </button>
      </div>
    </>
  );
}

/**
 * Checkpoint: predict which question's ungrounded answer would be wrong, then turn retrieval off and
 * pick it. The instructions give the one fact needed to reason it out — the model's only fallback, with
 * no retrieval, is always "Paris" — so the question is which of the other two facts that fallback
 * contradicts, not which text looks right after reading all three.
 */
export function RagCheckpoint() {
  const [query, setQuery] = useState<string | null>(null);
  const [useRetrieval, setUseRetrieval] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const q = query ? findQuery(query) : null;
  const answer = q ? generate(q, useRetrieval) : null;
  const passed = q !== null && !useRetrieval && generate(q, false) !== retrieve(q).answer;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const select = <T,>(setter: (v: T) => void) => (v: T) => {
    setHasInteracted(true);
    setter(v);
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          Every question falls back on the exact same default guess, <strong>&ldquo;{DEFAULT_PRIOR_ANSWER}&rdquo;</strong>,
          whenever retrieval is off. Predict which question that guess is <strong>wrong</strong> for, turn
          retrieval <strong>off</strong>, and pick it.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a question and toggle retrieval"
    >
      <div className={styles.buttons}>
        {QUERIES.map((item) => (
          <button
            type="button"
            key={item.label}
            className={item.label === query ? styles.buttonActive : styles.button}
            onClick={() => select<string>(setQuery)(item.label)}
          >
            {item.label.replace("Q: ", "")}
          </button>
        ))}
      </div>
      <div className={styles.buttons}>
        <button type="button" className={!useRetrieval ? styles.buttonActive : styles.button} onClick={() => select<boolean>(setUseRetrieval)(false)}>
          No retrieval
        </button>
        <button type="button" className={useRetrieval ? styles.buttonActive : styles.button} onClick={() => select<boolean>(setUseRetrieval)(true)}>
          With retrieval
        </button>
      </div>
      <div>{answer ? `answer: "${answer}" (truth: "${retrieve(q!).answer}")` : "pick a question"}</div>
    </CheckpointFrame>
  );
}
