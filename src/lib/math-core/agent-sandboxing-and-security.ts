/**
 * Every permission an agent is granted widens what a mistake (or a hijacked prompt) can do — its blast
 * radius. Sandboxing means granting the smallest set of permissions that still lets the assigned task
 * succeed, not the largest set that seems convenient. Here the task is fixed — "fetch the latest price
 * from an API and save it to a file" — and it genuinely needs exactly two of four available permissions.
 */
export type PermissionId = "read" | "write" | "api" | "execute";

export interface Permission {
  id: PermissionId;
  label: string;
  /** A hand-assigned risk weight: how much damage this permission alone could cause if misused. */
  weight: number;
}

export const PERMISSIONS: Permission[] = [
  { id: "read", label: "Read files", weight: 1 },
  { id: "write", label: "Write files", weight: 2 },
  { id: "api", label: "Call external API", weight: 3 },
  { id: "execute", label: "Execute arbitrary code", weight: 5 },
];

export type PermissionState = Record<PermissionId, boolean>;

export const NONE_GRANTED: PermissionState = { read: false, write: false, api: false, execute: false };
export const ALL_GRANTED: PermissionState = { read: true, write: true, api: true, execute: true };

/** The task ("fetch the latest price from an API and save it to a file") needs exactly these two permissions. */
export const REQUIRED: PermissionId[] = ["write", "api"];

export function blastRadius(state: PermissionState): number {
  return PERMISSIONS.reduce((total, p) => total + (state[p.id] ? p.weight : 0), 0);
}

export function taskSucceeds(state: PermissionState): boolean {
  return REQUIRED.every((id) => state[id]);
}

/** The permission state that grants exactly the required set and nothing else. */
export const MINIMAL_STATE: PermissionState = PERMISSIONS.reduce(
  (acc, p) => ({ ...acc, [p.id]: REQUIRED.includes(p.id) }),
  {} as PermissionState,
);

/** The smallest blast radius any permission state can have while still letting the task succeed. */
export const MINIMAL_BLAST_RADIUS = blastRadius(MINIMAL_STATE);

export const MAX_BLAST_RADIUS = blastRadius(ALL_GRANTED);

/** A permission state is "minimal" when the task succeeds and no granted permission is unused by it. */
export function isMinimal(state: PermissionState): boolean {
  return taskSucceeds(state) && blastRadius(state) === MINIMAL_BLAST_RADIUS;
}
