"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GENESIS_PREV_HASH,
  GENESIS_DATA,
  DIFFICULTY_TARGET,
  MAX_NONCE,
  CHECKPOINT_BLOCK_DATA,
  blockHash,
  meetsTarget,
  GENESIS_MINED,
} from "@/lib/math-core/nakamoto-consensus-and-proof-of-work";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "nakamoto-consensus-and-proof-of-work";

function NonceSlider({ value, onChange, max = MAX_NONCE }: { value: number; onChange: (n: number) => void; max?: number }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>nonce = {value}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 220 }}
      />
    </div>
  );
}

function HashVsTarget({ hash, target }: { hash: number; target: number }) {
  const found = meetsTarget(hash, target);
  return (
    <>
      <ContributionBars
        items={[
          { label: "hash", value: hash },
          { label: "target", value: target },
        ]}
        max={999}
        formatValue={(v) => v.toFixed(0)}
      />
      <p className={styles.stepCount} style={{ color: found ? "var(--accent2)" : "var(--ink-faint)" }}>
        {found ? "✓ under the target — this block is mined" : "over the target — try another nonce"}
      </p>
    </>
  );
}

/** Intuition beat: slide the nonce and watch the hash jump around unpredictably — no pattern to exploit, just search. */
export function IntuitionDemo() {
  const [nonce, setNonce] = useState(0);
  const hash = blockHash(GENESIS_PREV_HASH, GENESIS_DATA, nonce);
  return (
    <>
      <NonceSlider value={nonce} onChange={setNonce} />
      <HashVsTarget hash={hash} target={DIFFICULTY_TARGET} />
    </>
  );
}

/** Play beat: step through nonces one at a time and watch attempts accumulate until one finally lands under the target. */
export function PlayDemo() {
  const [nonce, setNonce] = useState(0);
  const hash = blockHash(GENESIS_PREV_HASH, GENESIS_DATA, nonce);
  const found = meetsTarget(hash, DIFFICULTY_TARGET);

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setNonce(0)}>
          Reset to nonce 0
        </button>
        <button type="button" className={styles.buttonPrimary} onClick={() => setNonce((n) => Math.min(MAX_NONCE, n + 1))}>
          Try next nonce
        </button>
      </div>
      <HashVsTarget hash={hash} target={DIFFICULTY_TARGET} />
      <p className={styles.stepCount}>
        {nonce + 1} attempt{nonce === 0 ? "" : "s"} so far{found ? ` — solved at nonce ${nonce}!` : ""}
      </p>
    </>
  );
}

/** Checkpoint: mine the block chained onto the genesis block's hash by finding a nonce whose hash meets the target. */
export function MiningCheckpoint() {
  const [nonce, setNonce] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const hash = nonce === null ? null : blockHash(GENESIS_MINED.hash, CHECKPOINT_BLOCK_DATA, nonce);
  const passed = hash !== null && meetsTarget(hash, DIFFICULTY_TARGET);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Chained onto the genesis block&apos;s hash ({GENESIS_MINED.hash}), find a nonce whose hash drops
          under the difficulty target of {DIFFICULTY_TARGET}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Slide to search for a winning nonce"
    >
      <NonceSlider
        value={nonce ?? 0}
        onChange={(n) => {
          setHasInteracted(true);
          setNonce(n);
        }}
      />
      {hash !== null && <HashVsTarget hash={hash} target={DIFFICULTY_TARGET} />}
    </CheckpointFrame>
  );
}
