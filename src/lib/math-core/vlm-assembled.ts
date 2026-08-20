import { PATCHES, DOMAIN, attentionWeights, attentionContext, type Vec2 } from "./cross-attention";

export { PATCHES, DOMAIN, attentionWeights, attentionContext };
export type { Vec2 };

export interface AnswerPrototype extends Vec2 {
  label: string;
}

/** Each answer's prototype embedding — here, deliberately the same coordinates as its matching image patch. */
export const ANSWERS: AnswerPrototype[] = PATCHES.map((p) => ({ label: p.label.replace(" patch", ""), x: p.x, y: p.y }));

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** The full pipeline: a text query cross-attends over image patches, then the resulting context vector
 * is matched to the nearest answer prototype — cross-attention (Chapter 3) feeding a nearest-neighbor
 * lookup (Chapter 1), chained into one small visual-question-answering model. */
export function answerQuestion(query: Vec2): { answer: AnswerPrototype; context: Vec2; distanceToAnswer: number } {
  const context = attentionContext(query);
  const ranked = ANSWERS.map((a) => ({ a, d: distance(context, a) })).sort((x, y) => x.d - y.d);
  return { answer: ranked[0].a, context, distanceToAnswer: ranked[0].d };
}

export function rankAnswers(query: Vec2): { label: string; d: number }[] {
  const context = attentionContext(query);
  return ANSWERS.map((a) => ({ label: a.label, d: distance(context, a) })).sort((x, y) => x.d - y.d);
}
