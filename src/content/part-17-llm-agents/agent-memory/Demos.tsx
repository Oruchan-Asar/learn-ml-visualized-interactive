"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { MESSAGES, QUERY_INDEX, contextWindowAt, inContextWindow, retrieve } from "@/lib/math-core/agent-memory";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import memStyles from "./MemoryTrace.module.css";

const CONCEPT_ID = "agent-memory";

/** Intuition beat: scrub through the conversation and watch the context window slide, dropping the fact once it fills. */
export function IntuitionDemo() {
  const [t, setT] = useState(0);
  const window = contextWindowAt(t);
  const windowIds = new Set(window.map((m) => m.id));

  return (
    <>
      <div className={memStyles.list}>
        {MESSAGES.slice(0, t + 1).map((m) => (
          <div key={m.id} className={windowIds.has(m.id) ? memStyles.inWindow : memStyles.evicted}>
            {m.text}
          </div>
        ))}
      </div>
      <label className={styles.sliderRow}>
        message
        <input type="range" min={0} max={MESSAGES.length - 1} step={1} value={t} onChange={(e) => setT(Number(e.target.value))} />
        {t}
      </label>
      <p className={memStyles.readout}>{inContextWindow(0, t) ? "the fact is still in the context window" : "the fact has fallen out of the context window"}</p>
    </>
  );
}

/** Play beat: a context-only agent fails at the final question; retrieval finds the fact anyway, straight from the full history. */
export function PlayDemo() {
  const window = contextWindowAt(QUERY_INDEX);
  const retrieved = retrieve(MESSAGES[QUERY_INDEX].text);
  return (
    <div className={memStyles.list}>
      <div className={memStyles.evicted}>Context-only agent sees: {window.map((m) => `"${m.text}"`).join(", ")} → no fact about favorite color anywhere in there.</div>
      <div className={memStyles.inWindow}>Retrieval-augmented agent searches all {QUERY_INDEX} prior messages → finds: &ldquo;{retrieved.text}&rdquo;</div>
    </div>
  );
}

/** Checkpoint: find the smallest t, among the candidates, where the fact has fallen out of the context window. */
export function MemoryCheckpoint() {
  const candidates = [2, 3, 4, 5];
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const smallestMissing = candidates.find((t) => !inContextWindow(0, t));
  const passed = chosen !== null && chosen === smallestMissing;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the <strong>smallest</strong> message index, among the candidates, where the fact has already fallen out of the context window.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a message index to try it"
    >
      <div className={styles.buttons}>
        {candidates.map((t) => (
          <button
            key={t}
            type="button"
            className={t === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(t);
            }}
          >
            t = {t}
          </button>
        ))}
      </div>
      {chosen !== null && <p className={memStyles.readout}>{inContextWindow(0, chosen) ? "fact still in window" : "fact evicted"}</p>}
    </CheckpointFrame>
  );
}
