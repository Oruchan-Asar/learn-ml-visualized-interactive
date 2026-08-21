import { describe, it, expect } from "vitest";
import { planOrder, readyTasks, DEPENDENCIES, TASKS } from "@/lib/math-core/planning-and-task-decomposition";

describe("planOrder", () => {
  it("matches the hand-computed deterministic order exactly", () => {
    expect(planOrder()).toEqual([
      "A: gather ingredients",
      "B: boil water",
      "C: toast bread",
      "D: steep tea",
      "E: butter toast",
      "F: serve breakfast",
    ]);
  });

  it("every task appears strictly after all of its dependencies", () => {
    const order = planOrder();
    for (const task of TASKS) {
      const taskIndex = order.indexOf(task);
      for (const dep of DEPENDENCIES[task]) {
        expect(order.indexOf(dep)).toBeLessThan(taskIndex);
      }
    }
  });

  it("includes every task exactly once", () => {
    const order = planOrder();
    expect(order).toHaveLength(TASKS.length);
    expect(new Set(order).size).toBe(TASKS.length);
  });
});

describe("readyTasks", () => {
  it("only the dependency-free task is ready with nothing completed", () => {
    expect(readyTasks([])).toEqual(["A: gather ingredients"]);
  });

  it("both B and C become ready once A is done", () => {
    expect(readyTasks(["A: gather ingredients"]).sort()).toEqual(["B: boil water", "C: toast bread"]);
  });

  it("F only becomes ready once both D and E are done", () => {
    const almostDone: (typeof TASKS)[number][] = ["A: gather ingredients", "B: boil water", "C: toast bread", "D: steep tea"];
    expect(readyTasks(almostDone)).toEqual(["E: butter toast"]);
    expect(readyTasks([...almostDone, "E: butter toast"])).toEqual(["F: serve breakfast"]);
  });
});

describe("checkpoint fact: among B, C, D, E, the last to appear in the plan order is E", () => {
  it("E has the highest index of the four in the computed order", () => {
    const order = planOrder();
    const candidates = ["B: boil water", "C: toast bread", "D: steep tea", "E: butter toast"] as const;
    const latest = [...candidates].sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
    expect(latest).toBe("E: butter toast");
  });
});
