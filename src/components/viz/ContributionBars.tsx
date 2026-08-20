"use client";

import type { ReactNode } from "react";
import styles from "./ContributionBars.module.css";

export interface Contribution {
  label: string;
  value: number;
}

export interface ContributionBarsProps {
  items: Contribution[];
  /** Formats the numeric label next to each bar — defaults to 2 decimal places. */
  formatValue?: (v: number) => string;
  readout?: ReactNode;
}

/** A horizontal diverging bar per item, centered on zero — positive contributions right, negative left. */
export function ContributionBars({ items, formatValue = (v) => v.toFixed(2), readout }: ContributionBarsProps) {
  const maxAbs = Math.max(1e-6, ...items.map((i) => Math.abs(i.value)));

  return (
    <div className={styles.wrap} role="img" aria-label="A diverging bar chart of signed feature contributions, centered on zero.">
      {items.map((item) => {
        const fraction = item.value / maxAbs;
        const halfWidth = Math.abs(fraction) * 50;
        return (
          <div className={styles.row} key={item.label}>
            <span className={styles.label}>{item.label}</span>
            <div className={styles.track}>
              <div className={styles.zeroLine} style={{ left: "50%" }} />
              {item.value >= 0 ? (
                <div className={styles.barPositive} style={{ left: "50%", width: `${halfWidth}%` }} />
              ) : (
                <div className={styles.barNegative} style={{ right: "50%", width: `${halfWidth}%` }} />
              )}
            </div>
            <span className={styles.value}>{formatValue(item.value)}</span>
          </div>
        );
      })}
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
