export interface RawEvent {
  t: number;
  amount: number;
}

/** One user's raw purchase events, each stamped with the time it actually happened. */
export const EVENTS: RawEvent[] = [
  { t: 1, amount: 10 },
  { t: 2, amount: 20 },
  { t: 4, amount: 15 },
  { t: 6, amount: 50 },
  { t: 8, amount: 5 },
  { t: 9, amount: 30 },
];

/** "Now" — the moment the feature store's snapshot was last refreshed. */
export const LATEST_TIME = 10;

/** Cumulative spend using only events strictly before `t` — what the feature legitimately looked like at that instant. */
export function cumulativeBefore(t: number): number {
  return EVENTS.filter((e) => e.t < t).reduce((sum, e) => sum + e.amount, 0);
}

/** The correct, point-in-time feature value for a label produced at `labelTime`. */
export function pointInTimeFeature(labelTime: number): number {
  return cumulativeBefore(labelTime);
}

/** The naive feature value: whatever the feature table currently holds, ignoring when the label actually happened. */
export function naiveFeature(labelTime: number): number {
  void labelTime;
  return cumulativeBefore(LATEST_TIME + 1);
}

export interface Label {
  t: number;
}

export const LABELS: Label[] = [{ t: 3 }, { t: 6 }, { t: 9 }];

export interface FeatureRow {
  labelTime: number;
  correct: number;
  naive: number;
  leak: number;
}

/** Builds a training set from LABELS, showing both the correct and naive feature value for each row. */
export function buildTrainingSet(): FeatureRow[] {
  return LABELS.map((label) => {
    const correct = pointInTimeFeature(label.t);
    const naive = naiveFeature(label.t);
    return { labelTime: label.t, correct, naive, leak: naive - correct };
  });
}
