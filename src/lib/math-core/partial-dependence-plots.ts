/**
 * A pure interaction model, f(x1,x2) = x1*x2 — x1 has no effect on its own, only through x2.
 * Four rows with symmetric x2 values are chosen so that averaging (the PDP) exactly cancels the
 * real, individually large effect that sweeping x1 has on each row (the ICE curves).
 */
export interface Row {
  x2: number;
}

export const ROWS: Row[] = [{ x2: 2 }, { x2: 1 }, { x2: -1 }, { x2: -2 }];
export const X1_GRID: number[] = [-2, -1, 0, 1, 2];

export function model(x1: number, x2: number): number {
  return x1 * x2;
}

/** One row's individual conditional expectation curve: predictions as x1 sweeps, x2 held at this row's value. */
export function iceCurve(row: Row, grid: number[] = X1_GRID): number[] {
  return grid.map((x1) => model(x1, row.x2));
}

export function allIceCurves(rows: Row[] = ROWS, grid: number[] = X1_GRID): number[][] {
  return rows.map((r) => iceCurve(r, grid));
}

/** The partial dependence curve: the AVERAGE prediction across all rows, at each grid value of x1. */
export function pdpCurve(rows: Row[] = ROWS, grid: number[] = X1_GRID): number[] {
  return grid.map((x1) => {
    const vals = rows.map((r) => model(x1, r.x2));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
}

/** How much the individual rows actually disagree at a given x1 — the spread the PDP average erases. */
export function iceSpreadAt(gridIndex: number, rows: Row[] = ROWS, grid: number[] = X1_GRID): number {
  const vals = rows.map((r) => model(grid[gridIndex], r.x2));
  return Math.max(...vals) - Math.min(...vals);
}
