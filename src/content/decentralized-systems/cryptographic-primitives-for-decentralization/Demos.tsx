"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TRANSACTIONS,
  merkleLevels,
  toySign,
  toyVerify,
} from "@/lib/math-core/cryptographic-primitives-for-decentralization";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import treeStyles from "./MerkleTree.module.css";

const CONCEPT_ID = "cryptographic-primitives-for-decentralization";
const ORIGINAL_ROOT = merkleLevels(TRANSACTIONS)[2][0];

/** A short label for a leaf box: the transaction text, truncated to fit. */
function shortLabel(tx: string): string {
  return tx.length > 16 ? `${tx.slice(0, 14)}…` : tx;
}

/**
 * Renders the 3 levels of a 4-leaf Merkle tree (leaves, 2 parents, root) as nested boxes,
 * connected top to bottom. `tamperedIndex` (if any) highlights one leaf and every box on its
 * path up to the root, so the reader can see exactly how far a single change propagates.
 */
function MerkleTreeView({
  txs,
  tamperedIndex,
  onLeafClick,
}: {
  txs: string[];
  tamperedIndex: number | null;
  onLeafClick?: (i: number) => void;
}) {
  const levels = merkleLevels(txs);
  const [leaves, parents, root] = levels;
  const tamperedParent = tamperedIndex === null ? null : Math.floor(tamperedIndex / 2);

  return (
    <div className={treeStyles.tree}>
      <div className={treeStyles.level}>
        <div className={tamperedIndex !== null ? treeStyles.nodeRoot : treeStyles.node}>
          <span className={treeStyles.nodeLabel}>root</span>
          <span className={treeStyles.nodeHash}>{root[0]}</span>
        </div>
      </div>
      <span className={treeStyles.connector}>↑ toyHashPair(parent₀, parent₁)</span>
      <div className={treeStyles.level}>
        {parents.map((p, i) => (
          <div key={i} className={i === tamperedParent ? treeStyles.nodeTampered : treeStyles.node}>
            <span className={treeStyles.nodeLabel}>parent {i}</span>
            <span className={treeStyles.nodeHash}>{p}</span>
          </div>
        ))}
      </div>
      <span className={treeStyles.connector}>↑ toyHashPair(leaf, leaf)</span>
      <div className={treeStyles.level}>
        {leaves.map((h, i) =>
          onLeafClick ? (
            <button
              key={i}
              type="button"
              className={i === tamperedIndex ? treeStyles.leafButtonActive : treeStyles.leafButton}
              onClick={() => onLeafClick(i)}
            >
              <span className={treeStyles.nodeLabel}>{shortLabel(txs[i])}</span>
              <span className={treeStyles.nodeHash}>{h}</span>
            </button>
          ) : (
            <div key={i} className={i === tamperedIndex ? treeStyles.nodeTampered : treeStyles.node}>
              <span className={treeStyles.nodeLabel}>{shortLabel(txs[i])}</span>
              <span className={treeStyles.nodeHash}>{h}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/** Intuition beat: the fixed 4-transaction tree, so the reader sees toyHash/toyHashPair land at every level before any formula. */
export function IntuitionDemo() {
  return (
    <MerkleTreeView txs={TRANSACTIONS} tamperedIndex={null} />
  );
}

const TAMPERED_TX = "alice pays bob 9";

/** Play beat: toggle transaction 0 between its original text and a tampered version, and watch the root (and a signature) react live. */
export function PlayDemo() {
  const [tampered, setTampered] = useState(false);
  const txs = tampered ? [TAMPERED_TX, ...TRANSACTIONS.slice(1)] : TRANSACTIONS;
  const levels = merkleLevels(txs);
  const root = levels[2][0];

  const signature = toySign(TRANSACTIONS[0], "alice-secret");
  const verified = toyVerify(txs[0], signature, "alice-secret");

  return (
    <>
      <MerkleTreeView txs={txs} tamperedIndex={tampered ? 0 : null} />
      <div className={styles.buttons}>
        <button type="button" className={tampered ? styles.button : styles.buttonActive} onClick={() => setTampered(false)}>
          Original
        </button>
        <button type="button" className={tampered ? styles.buttonActive : styles.button} onClick={() => setTampered(true)}>
          Tamper tx 0
        </button>
      </div>
      <p className={styles.stepCount}>
        root = {root} — Alice&apos;s signature over the original message {verified ? "still verifies ✓" : "no longer verifies ✗"}
      </p>
    </>
  );
}

/** Checkpoint: tamper any one leaf and confirm the root changes — tamper-evidence, made clickable. */
export function MerkleCheckpoint() {
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const txs = tamperedIndex === null ? TRANSACTIONS : TRANSACTIONS.map((t, i) => (i === tamperedIndex ? `${t}!` : t));
  const root = merkleLevels(txs)[2][0];
  const passed = tamperedIndex !== null && root !== ORIGINAL_ROOT;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Click any one transaction below to tamper with it (a character gets appended), and watch the{" "}
          <strong>root</strong> change from its original value of {ORIGINAL_ROOT}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a transaction to tamper with it"
    >
      <MerkleTreeView
        txs={txs}
        tamperedIndex={tamperedIndex}
        onLeafClick={(i) => {
          setHasInteracted(true);
          setTamperedIndex((prev) => (prev === i ? null : i));
        }}
      />
    </CheckpointFrame>
  );
}
