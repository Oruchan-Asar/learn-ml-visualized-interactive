/**
 * Primary-backup replication: one primary node takes every write, appends it
 * to its own log, and ships that log to a set of backups. Backups replicate
 * at their own pace — network lag, a slow disk, a brief partition — so at
 * any moment each backup may be behind the primary by a different amount.
 *
 * If the primary crashes, whichever backup has replicated the most of the
 * primary's log should be promoted. Anything the primary wrote that never
 * reached that backup is gone for good — there's no third copy to recover
 * it from.
 */

export interface BackupState {
  id: string;
  /** How many of the primary's log entries this backup has durably replicated. */
  replicatedUpTo: number;
}

/** The fixed 7-write primary log used throughout this chapter's examples. */
export const PRIMARY_LOG: string[] = ["w1", "w2", "w3", "w4", "w5", "w6", "w7"];

/** The three backups' replication state at the moment the primary crashes. */
export const BACKUPS: BackupState[] = [
  { id: "B1", replicatedUpTo: 5 },
  { id: "B2", replicatedUpTo: 7 },
  { id: "B3", replicatedUpTo: 3 },
];

/**
 * The backup to promote: whichever has replicated the most of the primary's
 * log. Ties go to whichever candidate appears first.
 */
export function selectPromotionCandidate(backups: BackupState[]): BackupState {
  if (backups.length === 0) throw new Error("no backups to promote");
  return backups.reduce((best, b) => (b.replicatedUpTo > best.replicatedUpTo ? b : best));
}

/** Writes that exist in the primary's log but never reached this backup — permanently lost if it's promoted. */
export function writesLost(primaryLogLength: number, backup: BackupState): number {
  return Math.max(0, primaryLogLength - backup.replicatedUpTo);
}

/** Whether every backup has replicated every write — zero lag, at this instant, across the board. */
export function isFullyReplicated(primaryLogLength: number, backups: BackupState[]): boolean {
  return backups.every((b) => b.replicatedUpTo >= primaryLogLength);
}

/** One step of a backup catching up: replicate one more entry, capped at the primary's log length. */
export function replicateOneStep(primaryLogLength: number, backup: BackupState): BackupState {
  return { ...backup, replicatedUpTo: Math.min(primaryLogLength, backup.replicatedUpTo + 1) };
}
