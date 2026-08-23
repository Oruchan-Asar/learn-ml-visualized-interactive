import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  REQUIRED,
  NONE_GRANTED,
  ALL_GRANTED,
  MINIMAL_STATE,
  MINIMAL_BLAST_RADIUS,
  MAX_BLAST_RADIUS,
  blastRadius,
  taskSucceeds,
  isMinimal,
  type PermissionState,
} from "@/lib/math-core/agent-sandboxing-and-security";

describe("agent-sandboxing-and-security", () => {
  it("blast radius of granting nothing is 0, and of granting everything is the sum of all weights", () => {
    expect(blastRadius(NONE_GRANTED)).toBe(0);
    expect(blastRadius(ALL_GRANTED)).toBe(1 + 2 + 3 + 5);
    expect(MAX_BLAST_RADIUS).toBe(11);
  });

  it("the task needs exactly write and api", () => {
    expect(REQUIRED).toEqual(["write", "api"]);
    expect(taskSucceeds(NONE_GRANTED)).toBe(false);
    expect(taskSucceeds(MINIMAL_STATE)).toBe(true);
  });

  it("the minimal state's blast radius is exactly the sum of the required permissions' weights", () => {
    expect(MINIMAL_BLAST_RADIUS).toBe(2 + 3);
    expect(MINIMAL_BLAST_RADIUS).toBe(5);
  });

  it("granting an extra unneeded permission still succeeds but is no longer minimal", () => {
    const withExtraRead: PermissionState = { ...MINIMAL_STATE, read: true };
    expect(taskSucceeds(withExtraRead)).toBe(true);
    expect(blastRadius(withExtraRead)).toBe(6);
    expect(isMinimal(withExtraRead)).toBe(false);
  });

  it("granting everything succeeds but is far from minimal", () => {
    expect(taskSucceeds(ALL_GRANTED)).toBe(true);
    expect(isMinimal(ALL_GRANTED)).toBe(false);
  });

  it("dropping the required api permission breaks the task even with execute granted", () => {
    const noApi: PermissionState = { read: false, write: true, api: false, execute: true };
    expect(taskSucceeds(noApi)).toBe(false);
  });

  it("exactly the required-only state is the unique minimal one among all four permissions", () => {
    expect(PERMISSIONS.map((p) => p.id)).toEqual(["read", "write", "api", "execute"]);
    expect(isMinimal(MINIMAL_STATE)).toBe(true);
  });
});
