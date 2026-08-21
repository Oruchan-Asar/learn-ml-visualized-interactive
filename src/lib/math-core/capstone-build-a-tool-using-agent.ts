/**
 * "What's my total trip cost in USD?" can't be answered by any single mechanism this part covered.
 * The hotel cost was mentioned early and has fallen out of the context window (Chapter 4's problem) — it
 * needs retrieval. The flight price is in euros and needs an exact currency conversion (Chapter 1's
 * problem) — it needs a tool call. And the two results only combine correctly if the agent runs them
 * in the right order (Chapter 3's problem) — retrieve and convert independently, sum only after both
 * are done.
 */
export interface Message {
  id: number;
  text: string;
  factValue?: number;
}

export const QUERY_INDEX = 4;
export const CONTEXT_WINDOW_SIZE = 3;

export const MESSAGES: Message[] = [
  { id: 0, text: "The hotel costs $360 total for the trip.", factValue: 360 },
  { id: 1, text: "What's the weather forecast?" },
  { id: 2, text: "Any good restaurants nearby?" },
  { id: 3, text: "I found a flight for €200." },
  { id: 4, text: "What's my total trip cost in USD?" },
];

export function contextWindowAt(t: number, windowSize: number = CONTEXT_WINDOW_SIZE): Message[] {
  return MESSAGES.slice(Math.max(0, t - windowSize + 1), t + 1);
}

/** Retrieval step: search every message before the query for the one carrying a numeric fact — the hotel cost is long gone from the context window by t=4. */
export function retrieveHotelCost(beforeIndex: number = QUERY_INDEX, messages: Message[] = MESSAGES): number {
  const found = messages.slice(0, beforeIndex).find((m) => m.factValue !== undefined);
  if (!found || found.factValue === undefined) throw new Error("No hotel cost fact found before this index.");
  return found.factValue;
}

/** Tool call step: exact currency conversion, no rounding, no guessing. */
export function convertToUSD(amountEUR: number, rate: number): number {
  return amountEUR * rate;
}

export interface AgentStep {
  task: string;
  result: number;
  detail: string;
}

export interface Scenario {
  label: string;
  flightEUR: number;
  rate: number;
  hotelUSD: number;
}

export const SCENARIOS: Scenario[] = [
  { label: "trip A", flightEUR: 200, rate: 1.1, hotelUSD: 360 },
  { label: "trip B", flightEUR: 250, rate: 1.08, hotelUSD: 360 },
  { label: "trip C", flightEUR: 180, rate: 1.15, hotelUSD: 300 },
];

/**
 * The full agent loop for one scenario: retrieve the hotel cost and convert the flight price
 * independently (neither depends on the other), then sum only once both steps have finished.
 */
export function runAgent(scenario: Scenario): { steps: AgentStep[]; total: number } {
  const hotel = scenario.hotelUSD;
  const flightUSD = convertToUSD(scenario.flightEUR, scenario.rate);
  const steps: AgentStep[] = [
    { task: "retrieve_hotel_cost", result: hotel, detail: `retrieved from memory, outside the context window: $${hotel}` },
    { task: "convert_flight_price", result: flightUSD, detail: `tool call: convertToUSD(${scenario.flightEUR}, ${scenario.rate}) = ${flightUSD.toFixed(2)}` },
    { task: "compute_total", result: hotel + flightUSD, detail: `${hotel} + ${flightUSD.toFixed(2)} = ${(hotel + flightUSD).toFixed(2)}` },
  ];
  return { steps, total: hotel + flightUSD };
}
