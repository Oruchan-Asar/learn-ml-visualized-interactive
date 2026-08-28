"use client";

import { useEffect, useMemo, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  ACCOUNTS,
  NUM_SHARDS,
  assignShard,
  isCrossShard,
  crossShardMessageCost,
  totalThroughput,
} from "@/lib/math-core/sharding-in-blockchains";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "sharding-in-blockchains";

/** Lays the 6 accounts out in 3 horizontal clusters, one column per shard, y-spread within each cluster. */
function buildNodes(): GraphNodeSpec[] {
  const columnX = [70, 190, 310];
  const byShard: Record<number, string[]> = { 0: [], 1: [], 2: [] };
  for (const acct of ACCOUNTS) byShard[assignShard(acct)].push(acct);

  const nodes: GraphNodeSpec[] = [];
  for (let shard = 0; shard < NUM_SHARDS; shard++) {
    const members = byShard[shard];
    members.forEach((acct, i) => {
      const y = 50 + i * 60 + (3 - members.length) * 15;
      nodes.push({ id: acct, x: columnX[shard], y, value: shard, label: acct });
    });
  }
  return nodes;
}

const NODES = buildNodes();

/** Intuition beat: a fixed cross-shard transaction (alice → bob) next to a same-shard one (alice → carol). */
export function IntuitionDemo() {
  const edges: [string, string][] = [
    ["alice", "bob"],
    ["alice", "carol"],
  ];
  return (
    <>
      <GraphPlayground
        nodes={NODES}
        edges={edges}
        focusNodeId="alice"
        highlightedNodeIds={["bob", "carol"]}
        readout={
          <span>
            alice → bob crosses shard {assignShard("alice")} → shard {assignShard("bob")} (cross-shard). alice →
            carol stays inside shard {assignShard("alice")} (same-shard).
          </span>
        }
      />
      <p className={styles.stepCount}>
        Each shard validates its own accounts independently — that&apos;s where the parallelism (and the
        throughput gain) comes from. But alice → bob needs both shards to agree on the outcome, since
        neither shard alone holds both balances.
      </p>
    </>
  );
}

/** Play beat: click any two accounts and see whether that transaction stays inside one shard or has to cross. */
export function PlayDemo() {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const onSelectNode = (id: string) => {
    if (from === null) {
      setFrom(id);
      setTo(null);
    } else if (to === null && id !== from) {
      setTo(id);
    } else {
      setFrom(id);
      setTo(null);
    }
  };

  const edges: [string, string][] = from && to ? [[from, to]] : [];
  const cross = from && to ? isCrossShard(from, to) : null;
  const cost = from && to ? crossShardMessageCost(from, to) : null;

  return (
    <>
      <GraphPlayground
        nodes={NODES}
        edges={edges}
        focusNodeId={from}
        highlightedNodeIds={to ? [to] : []}
        onSelectNode={onSelectNode}
        readout={
          <span>
            {from && to
              ? `${from} → ${to}: ${cross ? "cross-shard" : "same-shard"} — ${cost} message${cost === 1 ? "" : "s"} to settle`
              : from
                ? `${from} selected — click a second account to pick the transaction's destination.`
                : "Click an account to pick where the transaction starts."}
          </span>
        }
      />
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setFrom(null);
            setTo(null);
          }}
        >
          Clear
        </button>
      </div>
      <p className={styles.stepCount}>
        Throughput with {NUM_SHARDS} shards at 10 tx/s each: {totalThroughput(NUM_SHARDS, 10)} tx/s total — but every
        cross-shard transaction costs extra relay messages that a same-shard one never needs.
      </p>
    </>
  );
}

/** Checkpoint: click a pair of accounts that forms a genuinely cross-shard transaction. */
export function CrossShardCheckpoint() {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = useMemo(() => from !== null && to !== null && isCrossShard(from, to), [from, to]);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const onSelectNode = (id: string) => {
    setHasInteracted(true);
    if (from === null) {
      setFrom(id);
      setTo(null);
    } else if (to === null && id !== from) {
      setTo(id);
    } else {
      setFrom(id);
      setTo(null);
    }
  };

  const edges: [string, string][] = from && to ? [[from, to]] : [];

  return (
    <CheckpointFrame
      instructions={<>Click two accounts, one after the other, that land in <strong>different</strong> shards.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click an account to start"
    >
      <GraphPlayground
        nodes={NODES}
        edges={edges}
        focusNodeId={from}
        highlightedNodeIds={to ? [to] : []}
        onSelectNode={onSelectNode}
        passed={passed}
        readout={
          from && to ? (
            <span>
              {from} (shard {assignShard(from)}) → {to} (shard {assignShard(to)})
            </span>
          ) : undefined
        }
      />
    </CheckpointFrame>
  );
}
