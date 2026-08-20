export interface Doc {
  label: string;
  x: number;
  y: number;
  answer: string;
}

export interface Query {
  label: string;
  x: number;
  y: number;
}

/** A tiny knowledge base — each fact's embedding, and the answer it grounds. */
export const DOCS: Doc[] = [
  { label: "Doc: capital of France", x: 2, y: 3, answer: "Paris" },
  { label: "Doc: capital of Japan", x: 0, y: 1, answer: "Tokyo" },
  { label: "Doc: capital of Australia", x: 4, y: 0, answer: "Canberra" },
];

/** Three questions, each embedded near the one document that actually answers it. */
export const QUERIES: Query[] = [
  { label: "Q: capital of France", x: 2.2, y: 2.8 },
  { label: "Q: capital of Japan", x: 0.3, y: 0.8 },
  { label: "Q: capital of Australia", x: 3.7, y: 0.4 },
];

export const DOMAIN: [number, number] = [-1, 5];

/** What an ungrounded generator falls back on with no retrieval — its single most common prior answer. */
export const DEFAULT_PRIOR_ANSWER = "Paris";

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findQuery(label: string): Query {
  const q = QUERIES.find((item) => item.label === label);
  if (!q) throw new Error(`Unknown query: ${label}`);
  return q;
}

/** The nearest document to a query — the entire retrieval step. */
export function retrieve(query: Query, docs: Doc[] = DOCS): Doc {
  return docs.reduce((best, d) => (distance(query, d) < distance(query, best) ? d : best));
}

export function rankDocs(query: Query, docs: Doc[] = DOCS): { doc: Doc; d: number }[] {
  return docs.map((d) => ({ doc: d, d: distance(query, d) })).sort((a, b) => a.d - b.d);
}

/** "Generation": with retrieval, answer from the retrieved fact; without it, fall back on the fixed prior. */
export function generate(query: Query, useRetrieval: boolean): string {
  return useRetrieval ? retrieve(query).answer : DEFAULT_PRIOR_ANSWER;
}
