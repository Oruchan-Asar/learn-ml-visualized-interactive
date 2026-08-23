/**
 * SWE-bench scores a candidate patch the only way that can't be gamed by style or intent: run a hidden
 * test suite against it and count exact pass/fail. Here the issue is "last_index(arr, target) should
 * return the LAST index of target in arr, or -1 if it's absent" against 5 fixed test cases. Three
 * candidate patches are just plain functions — no simulation, they really run against the tests below.
 */
export interface TestCase {
  label: string;
  arr: number[];
  target: number;
  expected: number;
}

export const TESTS: TestCase[] = [
  { label: "[1,2,3,2,1], target 2", arr: [1, 2, 3, 2, 1], target: 2, expected: 3 },
  { label: "[5,5,5], target 5", arr: [5, 5, 5], target: 5, expected: 2 },
  { label: "[1,2,3], target 4", arr: [1, 2, 3], target: 4, expected: -1 },
  { label: "[], target 1", arr: [], target: 1, expected: -1 },
  { label: "[7], target 7", arr: [7], target: 7, expected: 0 },
];

export type PatchId = "A" | "B" | "C";

export interface Patch {
  id: PatchId;
  label: string;
  run: (arr: number[], target: number) => number;
}

export const PATCHES: Patch[] = [
  { id: "A", label: "Patch A: return arr.indexOf(target)", run: (arr, target) => arr.indexOf(target) },
  { id: "B", label: "Patch B: return arr.lastIndexOf(target)", run: (arr, target) => arr.lastIndexOf(target) },
  {
    id: "C",
    label: "Patch C: hardcoded for the one visible test",
    run: (arr, target) => (arr.length === 5 && target === 2 ? 3 : -1),
  },
];

export function patchById(id: PatchId): Patch {
  const patch = PATCHES.find((p) => p.id === id);
  if (!patch) throw new Error(`unknown patch ${id}`);
  return patch;
}

/** Runs one patch against every test case, returning a pass/fail per test in fixed order. */
export function testResults(id: PatchId): boolean[] {
  const patch = patchById(id);
  return TESTS.map((t) => patch.run(t.arr, t.target) === t.expected);
}

export function passCount(id: PatchId): number {
  return testResults(id).filter(Boolean).length;
}

export function passRate(id: PatchId): number {
  return passCount(id) / TESTS.length;
}

/** SWE-bench's actual bar: does the patch resolve the issue, i.e. pass every test in the hidden suite? */
export function resolvesIssue(id: PatchId): boolean {
  return passRate(id) === 1;
}
