/**
 * Splitting a task across specialized agents means a coordinator has to hand results from one agent to
 * another — and that handoff usually crosses a real interface boundary (JSON in, JSON out) with no
 * compile-time guarantee the shapes actually match. A research agent returns a structured object; a
 * writer agent expects a plain fact string. Pass the whole object where the string belongs, and nothing
 * crashes — it just silently stringifies into garbage.
 */
export interface ResearchResult {
  topic: string;
  fact: string;
}

export const FACTS: Record<string, string> = {
  "Mount Everest": "is the tallest mountain above sea level",
  "The Pacific Ocean": "is the largest and deepest ocean on Earth",
  Saturn: "has the most extensive ring system of any planet",
};

export const TOPICS = Object.keys(FACTS);

/** The research agent: given a topic, returns a structured result — not a plain string. */
export function researchAgent(topic: string): ResearchResult {
  return { topic, fact: FACTS[topic] };
}

/** The writer agent: expects a plain fact string, and the subject to attach it to. */
export function writerAgent(subject: string, fact: string): string {
  return `${subject} ${fact}.`;
}

/** The correct handoff: the coordinator passes exactly the two fields the writer agent expects. */
export function correctHandoff(topic: string): string {
  const result = researchAgent(topic);
  return writerAgent(result.topic, result.fact);
}

/**
 * The broken handoff: the coordinator passes the whole ResearchResult object where the writer agent
 * expects a plain string. Nothing throws — the object just stringifies into "[object Object]" wherever
 * it's interpolated, exactly the failure mode a real JSON-handoff bug between two services produces.
 */
export function brokenHandoff(topic: string): string {
  const result = researchAgent(topic);
  const wrongArgument = result as unknown as string; // the coordinator's bug, made explicit
  return writerAgent(result.topic, wrongArgument);
}
