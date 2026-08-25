import styles from "./LagrangeDiagram.module.css";

export interface LagrangeDiagramProps {
  x: number;
  y: number;
  passed?: boolean;
  size?: number;
  domain?: [number, number];
}

const REFERENCE_RADII = [1.5, Math.SQRT2 * 2, 4];
const ARROW_LENGTH = 38;

/**
 * A bespoke diagram for the Lagrange chapter: level circles of f(x,y)=x²+y² centered on the
 * origin, the constraint line x+y=4 dashed across it, a draggable-free point on that line, and
 * two fixed-length arrows — ∇f (accent) and ∇g (ink) — so their *angle* can be compared directly.
 * They point the same way exactly at the constrained optimum, where the level circle is tangent
 * to the line.
 */
export function LagrangeDiagram({ x, y, passed = false, size = 320, domain = [-0.5, 4.5] }: LagrangeDiagramProps) {
  const margin = 26;
  const [dMin, dMax] = domain;
  const span = dMax - dMin;
  const inner = size - 2 * margin;
  const scaleX = (v: number) => margin + ((v - dMin) / span) * inner;
  const scaleY = (v: number) => size - margin - ((v - dMin) / span) * inner;
  const scaleLen = (v: number) => (v / span) * inner;

  const px = scaleX(x);
  const py = scaleY(y);

  const lineP1 = { cx: scaleX(-0.25), cy: scaleY(4.25) };
  const lineP2 = { cx: scaleX(4.25), cy: scaleY(-0.25) };

  const activeRadius = Math.sqrt(x * x + y * y);

  // Normalized, fixed-length arrows so their angle (not magnitude) is what's directly comparable.
  const gradF = { x: 2 * x, y: 2 * y };
  const gradFMag = Math.hypot(gradF.x, gradF.y) || 1;
  const gradG = { x: 1, y: 1 };
  const gradGMag = Math.hypot(gradG.x, gradG.y);

  const fTipX = px + (gradF.x / gradFMag) * ARROW_LENGTH;
  const fTipY = py - (gradF.y / gradFMag) * ARROW_LENGTH;
  const gTipX = px + (gradG.x / gradGMag) * ARROW_LENGTH;
  const gTipY = py - (gradG.y / gradGMag) * ARROW_LENGTH;

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label="Level circles of f centered on the origin, the constraint line x+y=4, and the gradients of f and the constraint at the current point."
      >
        <line x1={scaleX(0)} y1={margin} x2={scaleX(0)} y2={size - margin} className={styles.axis} />
        <line x1={margin} y1={scaleY(0)} x2={size - margin} y2={scaleY(0)} className={styles.axis} />

        {REFERENCE_RADII.map((r) => (
          <circle key={r} cx={scaleX(0)} cy={scaleY(0)} r={scaleLen(r)} className={styles.levelCircle} />
        ))}
        <circle cx={scaleX(0)} cy={scaleY(0)} r={scaleLen(activeRadius)} className={styles.levelCircleActive} />

        <line x1={lineP1.cx} y1={lineP1.cy} x2={lineP2.cx} y2={lineP2.cy} className={styles.constraintLine} />
        <text x={scaleX(2.6)} y={scaleY(1.6)} className={styles.label}>
          x + y = 4
        </text>

        <line x1={px} y1={py} x2={gTipX} y2={gTipY} className={styles.constraintArrow} />
        <line x1={px} y1={py} x2={fTipX} y2={fTipY} className={styles.gradArrow} />

        <circle cx={px} cy={py} r={6.5} className={passed ? styles.pointPassed : styles.point} />
      </svg>
    </div>
  );
}
