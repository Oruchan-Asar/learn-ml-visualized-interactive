import { describe, expect, it } from "vitest";
import { daysBetween, computeNextStreak, type StreakState } from "@/lib/mastery/streak";

const EMPTY: StreakState = { currentStreak: 0, longestStreak: 0, lastActiveDay: "" };

describe("daysBetween", () => {
  it("is 0 for the same day", () => {
    expect(daysBetween("2026-08-21", "2026-08-21")).toBe(0);
  });

  it("is 1 for consecutive days", () => {
    expect(daysBetween("2026-08-21", "2026-08-22")).toBe(1);
  });

  it("crosses a month boundary correctly", () => {
    expect(daysBetween("2026-08-31", "2026-09-01")).toBe(1);
  });

  it("crosses a leap-year February correctly", () => {
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });

  it("handles a multi-day gap", () => {
    expect(daysBetween("2026-08-15", "2026-08-22")).toBe(7);
  });
});

describe("computeNextStreak", () => {
  it("starts a fresh streak at 1 with no prior activity", () => {
    const next = computeNextStreak(EMPTY, "2026-08-21");
    expect(next).toEqual({ currentStreak: 1, longestStreak: 1, lastActiveDay: "2026-08-21" });
  });

  it("returns the exact same object when today is already the last active day", () => {
    const prev: StreakState = { currentStreak: 3, longestStreak: 5, lastActiveDay: "2026-08-21" };
    const next = computeNextStreak(prev, "2026-08-21");
    expect(next).toBe(prev);
  });

  it("extends the streak by 1 on the very next day", () => {
    const prev: StreakState = { currentStreak: 3, longestStreak: 5, lastActiveDay: "2026-08-21" };
    const next = computeNextStreak(prev, "2026-08-22");
    expect(next).toEqual({ currentStreak: 4, longestStreak: 5, lastActiveDay: "2026-08-22" });
  });

  it("raises longestStreak once currentStreak passes it", () => {
    const prev: StreakState = { currentStreak: 5, longestStreak: 5, lastActiveDay: "2026-08-21" };
    const next = computeNextStreak(prev, "2026-08-22");
    expect(next).toEqual({ currentStreak: 6, longestStreak: 6, lastActiveDay: "2026-08-22" });
  });

  it("resets to 1 after a two-day gap", () => {
    const prev: StreakState = { currentStreak: 10, longestStreak: 10, lastActiveDay: "2026-08-20" };
    const next = computeNextStreak(prev, "2026-08-22");
    expect(next).toEqual({ currentStreak: 1, longestStreak: 10, lastActiveDay: "2026-08-22" });
  });

  it("resets to 1 after a much longer gap, keeping the longest streak on record", () => {
    const prev: StreakState = { currentStreak: 30, longestStreak: 30, lastActiveDay: "2026-01-01" };
    const next = computeNextStreak(prev, "2026-08-22");
    expect(next).toEqual({ currentStreak: 1, longestStreak: 30, lastActiveDay: "2026-08-22" });
  });
});
