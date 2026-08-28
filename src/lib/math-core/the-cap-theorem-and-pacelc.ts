export type CapChoice = "CP" | "AP";

export interface PartitionScenario {
  requestingReplica: string;
  /** The value this replica has locally, right now. */
  localValue: number;
  /** Whether this replica's local value is actually the latest write (false = it's stale, cut off from the side that has the newer write). */
  hasLatestWrite: boolean;
}

export interface PartitionResponse {
  responds: boolean;
  value: number | null;
  /** Whether the response (or refusal) is guaranteed consistent with the latest committed write. */
  consistent: boolean;
}

/**
 * During a partition there is no third option: a CP system refuses to answer unless it can prove it
 * has the latest write (which, cut off, it can't — so it blocks/errors), while an AP system always
 * answers with whatever it has locally, accepting that the answer might be stale.
 */
export function resolveDuringPartition(scenario: PartitionScenario, choice: CapChoice): PartitionResponse {
  if (choice === "CP") {
    return { responds: false, value: null, consistent: true };
  }
  return { responds: true, value: scenario.localValue, consistent: scenario.hasLatestWrite };
}

/** A scenario where the requesting replica is cut off from the side that holds the newest write. */
export const STALE_PARTITION_SCENARIO: PartitionScenario = {
  requestingReplica: "R2",
  localValue: 1,
  hasLatestWrite: false,
};

/**
 * PACELC's extension: even with no partition (the "Else" case), a system still trades Latency against
 * Consistency — synchronously confirming a write with every replica lowers latency guarantees but
 * raises consistency, and vice versa. Combining the partition-time and normal-time choices gives one
 * of the 4 canonical labels real systems get classified under.
 */
export function pacelcLabel(chooseConsistencyDuringPartition: boolean, chooseConsistencyElse: boolean): string {
  const p = chooseConsistencyDuringPartition ? "PC" : "PA";
  const e = chooseConsistencyElse ? "EC" : "EL";
  return `${p}/${e}`;
}

export interface SystemProfile {
  name: string;
  chooseConsistencyDuringPartition: boolean;
  chooseConsistencyElse: boolean;
}

/** A few real systems' well-known PACELC classifications, for the worked example. */
export const SYSTEM_PROFILES: SystemProfile[] = [
  { name: "DynamoDB / Cassandra (default)", chooseConsistencyDuringPartition: false, chooseConsistencyElse: false },
  { name: "MongoDB (majority writes)", chooseConsistencyDuringPartition: true, chooseConsistencyElse: false },
  { name: "A synchronously-replicated SQL cluster", chooseConsistencyDuringPartition: true, chooseConsistencyElse: true },
];

export function systemLabel(profile: SystemProfile): string {
  return pacelcLabel(profile.chooseConsistencyDuringPartition, profile.chooseConsistencyElse);
}
