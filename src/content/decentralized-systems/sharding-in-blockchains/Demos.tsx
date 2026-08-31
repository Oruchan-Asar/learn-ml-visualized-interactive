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

// Tall enough for 3 stacked nodes (the biggest shard) at SPACING apart without their id/value
// labels colliding with a neighbor's — GraphPlayground's default 220px height packed them too
// tightly and the labels visibly overlapped. Widened past the default 320 too, since the
// rightmost column's longest label ("frank") otherwise clips against the right edge.
const GRAPH_HEIGHT = 250;
const GRAPH_WIDTH = 340;
const TOP = 40;
const SPACING = 80;

/** Lays the 6 accounts out in 3 horizontal clusters, one column per shard, y-spread within each cluster. */
function buildNodes(): GraphNodeSpec[] {
  const columnX = [70, 190, 300];
  const byShard: Record<number, string[]> = { 0: [], 1: [], 2: [] };
  for (const acct of ACCOUNTS) byShard[assignShard(acct)].push(acct);

  const maxMembers = Math.max(...Object.values(byShard).map((members) => members.length));
  const nodes: GraphNodeSpec[] = [];
  for (let shard = 0; shard < NUM_SHARDS; shard++) {
    const members = byShard[shard];
    const offset = ((maxMembers - members.length) * SPACING) / 2;
    members.forEach((acct, i) => {
      const y = TOP + offset + i * SPACING;
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
        height={GRAPH_HEIGHT}
        width={GRAPH_WIDTH}
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
        height={GRAPH_HEIGHT}
        width={GRAPH_WIDTH}
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

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

/**
 * Checkpoint: find EVERY pair of accounts that lands in the SAME shard — not just any two accounts
 * in different shards. 11 of the 15 possible pairs are cross-shard, so "click any two that differ"
 * passed on nearly 3 out of 4 random clicks; the same-shard pairs are the rare, interesting case
 * (only 4 of 15), and finding all of them requires actually working out each account's shard.
 */
export function CrossShardCheckpoint() {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [foundPairs, setFoundPairs] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const allSameShardPairs = useMemo(() => {
    const pairs = new Set<string>();
    for (let i = 0; i < ACCOUNTS.length; i++) {
      for (let j = i + 1; j < ACCOUNTS.length; j++) {
        if (!isCrossShard(ACCOUNTS[i], ACCOUNTS[j])) pairs.add(pairKey(ACCOUNTS[i], ACCOUNTS[j]));
      }
    }
    return pairs;
  }, []);
  const totalPairs = (ACCOUNTS.length * (ACCOUNTS.length - 1)) / 2;

  const passed = foundPairs.size === allSameShardPairs.size;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const onSelectNode = (id: string) => {
    setHasInteracted(true);
    if (from === null) {
      setFrom(id);
      setTo(null);
    } else if (to === null && id !== from) {
      if (!isCrossShard(from, id)) {
        setFoundPairs((prev) => new Set(prev).add(pairKey(from, id)));
      }
      setTo(id);
    } else {
      setFrom(id);
      setTo(null);
    }
  };

  const confirmedEdges: [string, string][] = [...allSameShardPairs]
    .filter((key) => foundPairs.has(key))
    .map((key) => key.split("-") as [string, string]);
  const currentEdge: [string, string][] = from && to ? [[from, to]] : [];

  return (
    <CheckpointFrame
      instructions={
        <>
          Click through pairs of accounts to find <strong>every</strong> pair that lands in the{" "}
          <strong>same</strong> shard — {allSameShardPairs.size} of the {totalPairs} possible pairs qualify.
          Cross-shard pairs are the common case; same-shard collisions are the rare, interesting one.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click an account to start"
    >
      <GraphPlayground
        nodes={NODES}
        height={GRAPH_HEIGHT}
        width={GRAPH_WIDTH}
        edges={[...confirmedEdges, ...currentEdge]}
        focusNodeId={from}
        highlightedNodeIds={to ? [to] : []}
        onSelectNode={onSelectNode}
        passed={passed}
        readout={
          <span>
            {from && to ? (
              <>
                {from} (shard {assignShard(from)}) → {to} (shard {assignShard(to)})
                {isCrossShard(from, to) ? " — cross-shard" : " — same-shard, found!"}
                {"  —  "}
              </>
            ) : null}
            {foundPairs.size} of {allSameShardPairs.size} same-shard pairs found
          </span>
        }
      />
    </CheckpointFrame>
  );
}
