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
  /**
   * Reference ceiling to normalize bar length against, instead of the items' own max magnitude.
   * With a single item, self-normalizing always produces a full-length bar — value/max(value) is 1
   * no matter what the value is, so the bar conveys nothing beyond the printed number. Pass the
   * meaningful upper bound for that quantity (e.g. 1 for a precision/probability, the starting loss
   * for a loss that's meant to shrink) so the bar's length actually tracks the value.
   */
  max?: number;
}

/** A horizontal diverging bar per item, centered on zero — positive contributions right, negative left. */
export function ContributionBars({ items, formatValue = (v) => v.toFixed(2), readout, max }: ContributionBarsProps) {
  const maxAbs = max ?? Math.max(1e-6, ...items.map((i) => Math.abs(i.value)));

  return (
    <div className={styles.wrap} role="img" aria-label="A diverging bar chart of signed feature contributions, centered on zero.">
      {items.map((item, index) => {
        const fraction = Math.min(1, Math.abs(item.value / maxAbs));
        const halfWidth = fraction * 50;
        return (
          <div className={styles.row} key={index}>
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
