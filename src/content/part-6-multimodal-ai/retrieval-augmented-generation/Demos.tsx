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
      onSelectWord={setQuery}
      domain={DOMAIN}
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
        onSelectWord={setQuery}
        domain={DOMAIN}
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

/** Checkpoint: turn retrieval off, and pick the question whose answer becomes wrong without it. */
export function RagCheckpoint() {
  const [query, setQuery] = useState<string | null>(null);
  const [useRetrieval, setUseRetrieval] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const q = query ? findQuery(query) : null;
  const passed = q !== null && !useRetrieval && generate(q, false) !== retrieve(q).answer;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Turn retrieval <strong>off</strong>, then pick the question whose answer becomes <strong>wrong</strong> without it.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a question and toggle retrieval to try it"
    >
      <div className={styles.buttons}>
        {QUERIES.map((item) => (
          <button
            type="button"
            key={item.label}
            className={item.label === query ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setQuery(item.label);
            }}
          >
            {item.label.replace("Q: ", "")}
          </button>
        ))}
      </div>
      <div className={styles.buttons}>
        <button
          type="button"
          className={!useRetrieval ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setUseRetrieval(false);
          }}
        >
          No retrieval
        </button>
        <button
          type="button"
          className={useRetrieval ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setUseRetrieval(true);
          }}
        >
          With retrieval
        </button>
      </div>
      <div>{q ? `answer: "${generate(q, useRetrieval)}"` : `default prior: "${DEFAULT_PRIOR_ANSWER}"`}</div>
    </CheckpointFrame>
  );
}
