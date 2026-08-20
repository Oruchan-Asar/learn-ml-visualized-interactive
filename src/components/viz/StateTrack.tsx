"use client";

import type { ReactNode } from "react";
import styles from "./StateTrack.module.css";

export interface StateTrackProps {
  states: number[];
  currentState: number;
  goalState?: number;
  /** Optional per-state label shown under the state number, e.g. a value estimate. */
  valueLabels?: (string | number)[];
  readout?: ReactNode;
}

/** A row of discrete states — the current one ringed, the goal one accented. Used across the
 * reinforcement-learning chapters for a small 1D "gridworld" (a corridor of states). */
export function StateTrack({ states, currentState, goalState, valueLabels, readout }: StateTrackProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {states.map((s) => {
          const isGoal = s === goalState;
          const isCurrent = s === currentState;
          return (
            <div key={s} className={`${isGoal ? styles.cellGoal : styles.cell} ${isCurrent ? styles.cellCurrent : ""}`}>
              <span>S{s}</span>
              {valueLabels && <span className={styles.stateLabel}>{valueLabels[s]}</span>}
            </div>
          );
        })}
      </div>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
