/**
 * A human-in-the-loop gate flags an action for approval when its risk score clears a threshold. Set the
 * threshold too low and every action stalls waiting on a human, defeating the point of autonomy; set it
 * too high and the one genuinely dangerous action slips through unreviewed. Here a fixed 5-step
 * trajectory has exactly one truly risky action — the rest are safe by a wide margin — so there's a
 * real range of thresholds that separates them cleanly.
 */
export interface AgentAction {
  step: number;
  description: string;
  /** Hand-assigned risk score on a 0-10 scale. */
  risk: number;
}

export const TRAJECTORY: AgentAction[] = [
  { step: 1, description: "List files in /tmp", risk: 1 },
  { step: 2, description: "Read config.yaml", risk: 2 },
  { step: 3, description: "Post a status update to #eng", risk: 3 },
  { step: 4, description: "Call payment API: refund $10,000 to a customer", risk: 9 },
  { step: 5, description: "Write a log entry to /var/log/agent.log", risk: 1 },
];

/** The step number of the one truly risky action in the trajectory. */
export const RISKY_STEP = 4;

export function needsApproval(action: AgentAction, threshold: number): boolean {
  return action.risk >= threshold;
}

export function flaggedSteps(threshold: number): number[] {
  return TRAJECTORY.filter((a) => needsApproval(a, threshold)).map((a) => a.step);
}

/** The highest risk score among every action that is NOT the truly risky one. */
export const MAX_SAFE_RISK = Math.max(...TRAJECTORY.filter((a) => a.step !== RISKY_STEP).map((a) => a.risk));

export const RISKY_RISK = TRAJECTORY.find((a) => a.step === RISKY_STEP)!.risk;

/** A threshold "correctly separates" the trajectory when it flags exactly the one risky step and nothing else. */
export function correctlySeparates(threshold: number): boolean {
  const flagged = flaggedSteps(threshold);
  return flagged.length === 1 && flagged[0] === RISKY_STEP;
}
