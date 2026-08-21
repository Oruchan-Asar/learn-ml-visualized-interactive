/**
 * A goal like "make breakfast" isn't a single action — it's a set of smaller tasks with real ordering
 * constraints between them (you can't butter toast that hasn't been toasted). Planning means finding a
 * valid execution order: every task appears only after everything it depends on.
 */
export const TASKS = ["A: gather ingredients", "B: boil water", "C: toast bread", "D: steep tea", "E: butter toast", "F: serve breakfast"] as const;
export type Task = (typeof TASKS)[number];

/** Each task's direct prerequisites — the tasks that must complete before it can start. */
export const DEPENDENCIES: Record<Task, Task[]> = {
  "A: gather ingredients": [],
  "B: boil water": ["A: gather ingredients"],
  "C: toast bread": ["A: gather ingredients"],
  "D: steep tea": ["B: boil water"],
  "E: butter toast": ["C: toast bread"],
  "F: serve breakfast": ["D: steep tea", "E: butter toast"],
};

/**
 * A valid execution order via Kahn's algorithm: repeatedly pick any task whose dependencies are all
 * already scheduled. Ties are broken alphabetically, so the result is deterministic even though B/C and
 * D/E could each legally run in either order relative to each other.
 */
export function planOrder(dependencies: Record<Task, Task[]> = DEPENDENCIES): Task[] {
  const remaining = new Set(Object.keys(dependencies) as Task[]);
  const done: Task[] = [];

  while (remaining.size > 0) {
    const ready = [...remaining].filter((task) => dependencies[task].every((dep) => done.includes(dep))).sort();
    const next = ready[0];
    done.push(next);
    remaining.delete(next);
  }
  return done;
}

/** The tasks immediately ready to start, given a set of already-completed tasks. */
export function readyTasks(completed: Task[], dependencies: Record<Task, Task[]> = DEPENDENCIES): Task[] {
  return (Object.keys(dependencies) as Task[]).filter((task) => !completed.includes(task) && dependencies[task].every((dep) => completed.includes(dep)));
}
