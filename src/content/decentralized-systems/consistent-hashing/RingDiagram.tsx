import styles from "./RingDiagram.module.css";

export interface RingMarker {
  id: string;
  pos: number;
}

export interface RingKeyMarker extends RingMarker {
  ownerId?: string;
}

export interface RingDiagramProps {
  ringSize: number;
  nodes: RingMarker[];
  keys?: RingKeyMarker[];
  /** Node ids to draw in the "highlighted" (e.g. just-added) color instead of the plain node color. */
  highlightNodeIds?: string[];
  /** A sequence of ring positions to connect with directional arrows, e.g. a Chord lookup's hop path. */
  path?: number[];
  size?: number;
  passed?: boolean;
}

/**
 * A bespoke ring diagram: nodes and keys placed by angle around a circle at `2*pi*pos/ringSize`,
 * position 0 at the top, increasing clockwise — so "walking clockwise" in prose matches walking
 * clockwise on screen. Reused as-is by the Chord and capstone chapters (with `path` for routing
 * hops), not reimplemented per chapter.
 */
export function RingDiagram({ ringSize, nodes, keys = [], highlightNodeIds = [], path, size = 320, passed = false }: RingDiagramProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 44;
  const highlighted = new Set(highlightNodeIds);

  const point = (pos: number, radius: number) => {
    const theta = -Math.PI / 2 + (pos / ringSize) * 2 * Math.PI;
    return { x: cx + radius * Math.cos(theta), y: cy + radius * Math.sin(theta) };
  };

  const nodeByPos = (pos: number) => nodes.find((n) => n.pos === pos);

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label={`A ring of size ${ringSize} with nodes and keys placed at their hash positions.`}
      >
        <circle cx={cx} cy={cy} r={r} className={styles.ring} />

        {path &&
          path.slice(0, -1).map((from, i) => {
            const to = path[i + 1];
            const p1 = point(from, r);
            const p2 = point(to, r);
            return <line key={`${from}-${to}-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className={styles.pathArrow} markerEnd="url(#ring-arrowhead)" />;
          })}

        {keys.map((k) => {
          const kp = point(k.pos, r);
          const owner = k.ownerId ? nodeByPos(nodes.find((n) => n.id === k.ownerId)?.pos ?? -1) : undefined;
          const op = owner ? point(owner.pos, r) : null;
          return (
            <g key={k.id}>
              {op && <line x1={kp.x} y1={kp.y} x2={op.x} y2={op.y} className={styles.ownerLine} />}
              <circle cx={kp.x} cy={kp.y} r={5} className={styles.key} />
              <text x={kp.x} y={kp.y - 10} textAnchor="middle" className={styles.keyLabel}>
                {k.id}·{k.pos}
              </text>
            </g>
          );
        })}

        {nodes.map((n) => {
          const p = point(n.pos, r);
          const cls = highlighted.has(n.id) ? (passed ? styles.nodeHighlightedPassed : styles.nodeHighlighted) : styles.node;
          return (
            <g key={n.id}>
              <circle cx={p.x} cy={p.y} r={11} className={cls} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" className={styles.nodeLabel}>
                {n.id}
              </text>
              <text x={p.x} y={p.y + (p.y > cy ? 24 : -18)} textAnchor="middle" className={styles.posLabel}>
                {n.pos}
              </text>
            </g>
          );
        })}

        <defs>
          <marker id="ring-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className={styles.arrowhead} />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
