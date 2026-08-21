/**
 * Without a tool, a model answering an arithmetic question has to produce a number from pattern-matched
 * intuition — genuinely close for small, memorized-looking products, genuinely wrong for anything larger.
 * With a calculator tool available, the same query becomes a structured call instead of a guess: the
 * model's job shifts from "compute the answer" to "recognize which function to invoke, with which
 * arguments" — and the returned value is exact, not estimated.
 */
export interface Query {
  a: number;
  b: number;
}

export const QUERIES: Query[] = [
  { a: 127, b: 38 },
  { a: 1234, b: 9 },
  { a: 58, b: 73 },
];

export function trueAnswer(q: Query): number {
  return q.a * q.b;
}

/** Rounds to one significant figure — a stand-in for the coarse, order-of-magnitude arithmetic a model does from pattern-matching alone, not real multiplication. */
function roundToOneSigFig(x: number): number {
  if (x === 0) return 0;
  const digits = Math.floor(Math.log10(Math.abs(x))) + 1;
  const scale = 10 ** (digits - 1);
  return Math.round(x / scale) * scale;
}

/** The free-text guess a model without tool access falls back on: multiply the two operands' rounded, one-significant-figure versions. */
export function freeTextGuess(q: Query): number {
  return roundToOneSigFig(q.a) * roundToOneSigFig(q.b);
}

export function guessError(q: Query): number {
  return Math.abs(trueAnswer(q) - freeTextGuess(q));
}

export interface Response {
  type: "tool_call" | "free_text_guess";
  value: number;
}

/** The model's actual behavior: call the tool (exact) if one is available, otherwise fall back to a free-text guess. */
export function respond(q: Query, toolAvailable: boolean): Response {
  return toolAvailable ? { type: "tool_call", value: trueAnswer(q) } : { type: "free_text_guess", value: freeTextGuess(q) };
}
