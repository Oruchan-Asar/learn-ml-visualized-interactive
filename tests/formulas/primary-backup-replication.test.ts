import { describe, it, expect } from "vitest";
import {
  PRIMARY_LOG,
  BACKUPS,
  selectPromotionCandidate,
  writesLost,
  isFullyReplicated,
  replicateOneStep,
  type BackupState,
} from "@/lib/math-core/primary-backup-replication";

describe("selectPromotionCandidate", () => {
  it("picks B2 (replicatedUpTo=7) as the most up-to-date backup in the worked scenario", () => {
    expect(selectPromotionCandidate(BACKUPS).id).toBe("B2");
  });

  it("breaks ties by picking the first candidate", () => {
    const tied: BackupState[] = [
      { id: "X", replicatedUpTo: 4 },
      { id: "Y", replicatedUpTo: 4 },
    ];
    expect(selectPromotionCandidate(tied).id).toBe("X");
  });

  it("throws on an empty backup list — there's nothing to promote", () => {
    expect(() => selectPromotionCandidate([])).toThrow();
  });
});

describe("writesLost", () => {
  it("matches the worked example exactly: 7-entry primary log against each backup", () => {
    expect(writesLost(PRIMARY_LOG.length, BACKUPS[0])).toBe(2); // B1: 7-5
    expect(writesLost(PRIMARY_LOG.length, BACKUPS[1])).toBe(0); // B2: 7-7
    expect(writesLost(PRIMARY_LOG.length, BACKUPS[2])).toBe(4); // B3: 7-3
  });

  it("never goes negative even if a backup is somehow ahead of the primary's length", () => {
    expect(writesLost(5, { id: "Z", replicatedUpTo: 9 })).toBe(0);
  });
});

describe("isFullyReplicated", () => {
  it("is false for the worked scenario (B1 and B3 are behind)", () => {
    expect(isFullyReplicated(PRIMARY_LOG.length, BACKUPS)).toBe(false);
  });

  it("is true once every backup has caught all the way up", () => {
    const caughtUp: BackupState[] = BACKUPS.map((b) => ({ ...b, replicatedUpTo: PRIMARY_LOG.length }));
    expect(isFullyReplicated(PRIMARY_LOG.length, caughtUp)).toBe(true);
  });
});

describe("replicateOneStep", () => {
  it("advances replicatedUpTo by exactly one", () => {
    expect(replicateOneStep(7, { id: "B1", replicatedUpTo: 5 }).replicatedUpTo).toBe(6);
  });

  it("caps at the primary's log length instead of overshooting", () => {
    expect(replicateOneStep(7, { id: "B2", replicatedUpTo: 7 }).replicatedUpTo).toBe(7);
  });
});
