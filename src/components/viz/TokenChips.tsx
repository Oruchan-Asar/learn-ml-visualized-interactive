"use client";

import styles from "./TokenChips.module.css";

export interface TokenChipsProps {
  tokens: string[];
  ids?: number[];
}

/** A word rendered as a row of its current tokens — characters, merged subwords, or a mix mid-merge. */
export function TokenChips({ tokens, ids }: TokenChipsProps) {
  return (
    <div className={styles.row}>
      {tokens.map((tok, i) => (
        <div key={i} className={tok.length > 1 ? styles.chipMerged : styles.chip}>
          <span className={styles.chipText}>{tok}</span>
          {ids && <span className={styles.chipId}>{ids[i] === -1 ? "?" : ids[i]}</span>}
        </div>
      ))}
    </div>
  );
}
