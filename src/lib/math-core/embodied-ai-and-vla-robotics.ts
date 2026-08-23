/**
 * A vision-language-action (VLA) model reads pixels and an instruction and outputs a low-level action.
 * Real systems (RT-2, OpenVLA, pi0) map camera frames and language tokens all the way to motor torques.
 * This toy version keeps the vision side fixed (a 2D end-effector position standing in for "what the
 * camera sees right now") and focuses on the part that's hand-computable: turning a tokenized language
 * instruction into a 2D action vector, exactly the way an action head turns a language+vision embedding
 * into a delta the arm should move.
 */

export interface Point {
  x: number;
  y: number;
}

/** Every token's fixed contribution to the action vector — the model's "vocabulary embedding" for actions. */
export const TOKEN_VECTORS: Record<string, Point> = {
  move: { x: 0, y: 0 },
  reach: { x: 0, y: 0 },
  the: { x: 0, y: 0 },
  to: { x: 0, y: 0 },
  cup: { x: 0, y: 0 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
};

/** The current observed end-effector position — standing in for what the camera reports. */
export const START_POSITION: Point = { x: 0, y: 0 };

/** The workspace the arm's end effector is confined to. */
export const WORKSPACE_BOUND = 3;

/** Sum of each token's action-vector contribution — the policy's language-to-action step. */
export function actionFromInstruction(tokens: string[]): Point {
  return tokens.reduce(
    (acc, tok) => {
      const v = TOKEN_VECTORS[tok] ?? { x: 0, y: 0 };
      return { x: acc.x + v.x, y: acc.y + v.y };
    },
    { x: 0, y: 0 },
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Applies an action to a position, clipped to the workspace bound on both axes. */
export function applyAction(pos: Point, action: Point, bound: number = WORKSPACE_BOUND): Point {
  return {
    x: clamp(pos.x + action.x, -bound, bound),
    y: clamp(pos.y + action.y, -bound, bound),
  };
}

/** End-to-end: instruction tokens + current position -> next end-effector position. */
export function nextPosition(pos: Point, tokens: string[]): Point {
  return applyAction(pos, actionFromInstruction(tokens));
}

export interface Instruction {
  label: string;
  tokens: string[];
}

/** Two instructions for the Intuition toggle, each moving the arm along a different axis. */
export const INTUITION_INSTRUCTIONS: Instruction[] = [
  { label: "move up", tokens: ["move", "up"] },
  { label: "move right", tokens: ["move", "right"] },
];

/** Three instructions for the Play beat, each combining two directional tokens. */
export const PLAY_INSTRUCTIONS: Instruction[] = [
  { label: "move up right", tokens: ["move", "up", "right"] },
  { label: "reach the cup left", tokens: ["reach", "the", "cup", "left"] },
  { label: "move down left", tokens: ["move", "down", "left"] },
];

/** Unseen checkpoint instruction: the same vocabulary, a new combination. */
export const CHECKPOINT_INSTRUCTION: Instruction = { label: "move down right", tokens: ["move", "down", "right"] };
