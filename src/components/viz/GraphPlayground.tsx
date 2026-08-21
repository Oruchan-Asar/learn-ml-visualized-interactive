"use client";

import type { ReactNode } from "react";
import styles from "./GraphPlayground.module.css";

export interface GraphNodeSpec {
  id: string;
  x: number;
  y: number;
  /** The scalar shown under the node — a feature value, not necessarily an integer. */
  value: number;
  label?: string;
}

export interface GraphPlaygroundProps {
  nodes: GraphNodeSpec[];
  /** Pairs of node ids that share an edge. */
  edges: [string, string][];
  /** A node id to visually emphasize, e.g. the one whose neighborhood is being aggregated. */
  focusNodeId?: string | null;
  /** Node ids to draw as part of the focus node's neighborhood (or an attention-weighted set). */
  highlightedNodeIds?: string[];
  /** Per-edge weight in [0,1] for edges touching the focus node — drawn as line thickness/opacity, e.g. attention weights. */
  edgeWeights?: Record<string, number>;
  onSelectNode?: (id: string) => void;
  width?: number;
  height?: number;
  readout?: ReactNode;
}

function edgeKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export function GraphPlayground({
  nodes,
  edges,
  focusNodeId = null,
  highlightedNodeIds = [],
  edgeWeights = {},
  onSelectNode,
  width = 320,
  height = 220,
  readout,
}: GraphPlaygroundProps) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const highlighted = new Set(highlightedNodeIds);

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="An interactive graph — nodes carry a numeric feature, edges connect neighbors."
      >
        {edges.map(([a, b]) => {
          const na = byId.get(a);
          const nb = byId.get(b);
          if (!na || !nb) return null;
          const touchesFocus = focusNodeId !== null && (a === focusNodeId || b === focusNodeId);
          const weight = edgeWeights[edgeKey(a, b)];
          return (
            <line
              key={edgeKey(a, b)}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              className={touchesFocus ? styles.edgeFocus : styles.edge}
              style={weight !== undefined ? { strokeWidth: 1 + weight * 5, opacity: 0.3 + weight * 0.7 } : undefined}
            />
          );
        })}
        {nodes.map((n) => {
          const isFocus = n.id === focusNodeId;
          const isHighlighted = highlighted.has(n.id);
          const r = isFocus ? 15 : 12;
          const nodeClass = isFocus ? styles.nodeFocus : isHighlighted ? styles.nodeHighlighted : styles.node;
          return (
            <g
              key={n.id}
              onClick={onSelectNode ? () => onSelectNode(n.id) : undefined}
              className={onSelectNode ? styles.clickable : undefined}
            >
              <circle cx={n.x} cy={n.y} r={r} className={nodeClass} />
              <text x={n.x} y={n.y - r - 6} textAnchor="middle" className={styles.idLabel}>
                {n.label ?? n.id}
              </text>
              <text x={n.x} y={n.y + r + 14} textAnchor="middle" className={styles.valueLabel}>
                {n.value.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
