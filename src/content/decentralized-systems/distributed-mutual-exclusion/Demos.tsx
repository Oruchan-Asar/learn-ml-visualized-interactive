"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TokenChips } from "@/components/viz/TokenChips";
import {
  REQUESTS,
  RING,
  hasPriority,
  shouldReplyImmediately,
  determineEntryOrder,
  replyMatrix,
  nextTokenHolder,
} from "@/lib/math-core/distributed-mutual-exclusion";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "distributed-mutual-exclusion";

function TimestampSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }} className={styles.stepCount}>
      {label} timestamp = {value}
      <input
        type="range"
        min={1}
        max={9}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "var(--accent)", width: 140 }}
      />
    </label>
  );
}

/** Intuition beat: drag "mine" and "theirs" timestamps and watch who has priority, before any formal rule. */
export function IntuitionDemo() {
  const [mine, setMine] = useState(3);
  const [theirs, setTheirs] = useState(5);
  const mineRequest = { nodeId: "M", timestamp: mine };
  const theirsRequest = { nodeId: "T", timestamp: theirs };
  const iWin = hasPriority(mineRequest, theirsRequest);

  return (
    <>
      <div className={styles.buttons}>
        <TimestampSlider label="Mine (M)" value={mine} onChange={setMine} />
        <TimestampSlider label="Theirs (T)" value={theirs} onChange={setTheirs} />
      </div>
      <div className={styles.script}>
        {iWin ? "My request has priority — I go first." : "Their request has priority — they go first."}
      </div>
    </>
  );
}

/** Play beat: the live reply matrix and entry order for the three fixed requests, plus a token-ring pass button. */
export function PlayDemo() {
  const matrix = replyMatrix(REQUESTS);
  const order = determineEntryOrder(REQUESTS);
  const [holder, setHolder] = useState("P");

  return (
    <>
      <div className={styles.script}>
        Requests: {REQUESTS.map((r) => `${r.nodeId}(ts=${r.timestamp})`).join(", ")}
        <br />
        Entry order (determineEntryOrder): <strong>{order.join(" → ")}</strong>
      </div>
      <div className={styles.script}>
        {REQUESTS.map((receiver) => (
          <div key={receiver.nodeId}>
            {receiver.nodeId} replies immediately to:{" "}
            {Object.entries(matrix[receiver.nodeId])
              .map(([who, replies]) => `${who}(${replies ? "yes" : "defers"})`)
              .join(", ")}
          </div>
        ))}
      </div>

      <div className={styles.stepCount} style={{ marginTop: 12 }}>
        Token ring: {RING.join(" → ")} → (back to {RING[0]})
      </div>
      <TokenChips tokens={RING} ids={RING.map((id) => (id === holder ? 1 : -1))} />
      <div className={styles.buttons} style={{ marginTop: 8 }}>
        <button type="button" className={styles.buttonPrimary} onClick={() => setHolder((h) => nextTokenHolder(RING, h))}>
          Pass token (currently {holder})
        </button>
      </div>
    </>
  );
}

/** Checkpoint: find a "theirs" timestamp for which Q (fixed ts=3) would reply immediately — i.e. Q has no priority. */
export function DistributedMutualExclusionCheckpoint() {
  const [theirs, setTheirs] = useState(9);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const mine = { nodeId: "Q", timestamp: 3 };
  const theirRequest = { nodeId: "Z", timestamp: theirs };
  const replies = shouldReplyImmediately("requesting", mine, theirRequest);
  const passed = replies === true;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Q is requesting the critical section with timestamp 3. Drag Z&apos;s timestamp so that Q would{" "}
          <strong>reply immediately</strong> to Z&apos;s request — meaning Z&apos;s request has priority over
          Q&apos;s own.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag Z's timestamp"
    >
      <TimestampSlider
        label="Z"
        value={theirs}
        onChange={(v) => {
          setHasInteracted(true);
          setTheirs(v);
        }}
      />
      <div className={styles.script}>
        shouldReplyImmediately(Q requesting, Z ts={theirs}) = <strong>{String(replies)}</strong>
      </div>
    </CheckpointFrame>
  );
}
