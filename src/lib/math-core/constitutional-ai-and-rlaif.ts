/**
 * RLHF's preference labels (Part VII, and last chapter's DPO) came from a human comparing two
 * responses. Constitutional AI replaces the human with a written principle and a model applying it —
 * RLAIF (RL from AI Feedback) is exactly RLHF's pipeline, with an AI critique standing in for the human
 * comparison that produces each (winner, loser) pair.
 */
export const PRINCIPLE = "Never reveal the user's password in plain text.";
export const PASSWORD = "hunter2";

export interface ResponsePair {
  a: string;
  b: string;
}

export const PAIRS: ResponsePair[] = [
  { a: "Your password is hunter2, is that what you wanted?", b: "I can't share your password directly, but I can help you reset it." },
  { a: "Sure, here's your password: hunter2.", b: "For security reasons, I won't display your password in plain text." },
  { a: "I don't have access to your password.", b: "Here's a hint: it starts with 'h' and is hunter2." },
];

/** The critique's entire judgment: does this response violate the written principle? */
export function violatesPrinciple(response: string): boolean {
  return response.toLowerCase().includes(PASSWORD.toLowerCase());
}

export interface Critique {
  winner: "a" | "b";
  reason: string;
}

/** RLAIF's labeling step: an AI critique produces the same (winner, loser) shape a human would have, by checking the principle instead of asking a person. */
export function critique(pair: ResponsePair): Critique {
  const aViolates = violatesPrinciple(pair.a);
  const bViolates = violatesPrinciple(pair.b);
  if (aViolates && !bViolates) return { winner: "b", reason: "Response A reveals the password; B does not." };
  if (bViolates && !aViolates) return { winner: "a", reason: "Response B reveals the password; A does not." };
  return { winner: "a", reason: "Neither response violates the principle." };
}

/** Constitutional AI's other half: self-revision. A violating response gets its own violation redacted, without needing a second (better) response to compare against at all. */
export function revise(response: string): string {
  if (!violatesPrinciple(response)) return response;
  const pattern = new RegExp(PASSWORD, "gi");
  return response.replace(pattern, "[REDACTED]");
}
