import { describe, expect, it } from "vitest";
import {
  TOKEN_VECTORS,
  START_POSITION,
  WORKSPACE_BOUND,
  actionFromInstruction,
  applyAction,
  nextPosition,
  INTUITION_INSTRUCTIONS,
  PLAY_INSTRUCTIONS,
  CHECKPOINT_INSTRUCTION,
} from "@/lib/math-core/embodied-ai-and-vla-robotics";

describe("embodied-ai-and-vla-robotics", () => {
  it("filler tokens contribute nothing to the action vector", () => {
    expect(actionFromInstruction(["move", "the", "to"])).toEqual({ x: 0, y: 0 });
  });

  it("directional tokens sum to the action vector", () => {
    expect(actionFromInstruction(["move", "up"])).toEqual({ x: 0, y: 1 });
    expect(actionFromInstruction(["move", "right"])).toEqual({ x: 1, y: 0 });
    expect(actionFromInstruction(["move", "up", "right"])).toEqual({ x: 1, y: 1 });
  });

  it("applies the action to the current position, clipped to the workspace bound", () => {
    expect(applyAction(START_POSITION, { x: 1, y: 1 })).toEqual({ x: 1, y: 1 });
    expect(applyAction({ x: WORKSPACE_BOUND, y: 0 }, { x: 1, y: 0 })).toEqual({ x: WORKSPACE_BOUND, y: 0 });
  });

  it("end to end: instruction tokens plus current position produce the next position", () => {
    expect(nextPosition(START_POSITION, ["move", "up", "right"])).toEqual({ x: 1, y: 1 });
    expect(nextPosition(START_POSITION, ["reach", "the", "cup", "left"])).toEqual({ x: -1, y: 0 });
  });

  it("intuition instructions move along a single axis each", () => {
    expect(actionFromInstruction(INTUITION_INSTRUCTIONS[0].tokens)).toEqual({ x: 0, y: 1 });
    expect(actionFromInstruction(INTUITION_INSTRUCTIONS[1].tokens)).toEqual({ x: 1, y: 0 });
  });

  it("play instructions combine two directions each", () => {
    expect(actionFromInstruction(PLAY_INSTRUCTIONS[0].tokens)).toEqual({ x: 1, y: 1 });
    expect(actionFromInstruction(PLAY_INSTRUCTIONS[1].tokens)).toEqual({ x: -1, y: 0 });
    expect(actionFromInstruction(PLAY_INSTRUCTIONS[2].tokens)).toEqual({ x: -1, y: -1 });
  });

  it("the checkpoint instruction resolves to an exact, unseen target position", () => {
    expect(actionFromInstruction(CHECKPOINT_INSTRUCTION.tokens)).toEqual({ x: 1, y: -1 });
    expect(nextPosition(START_POSITION, CHECKPOINT_INSTRUCTION.tokens)).toEqual({ x: 1, y: -1 });
  });

  it("has fixed vocabulary vectors for every token used", () => {
    expect(TOKEN_VECTORS.left).toEqual({ x: -1, y: 0 });
    expect(TOKEN_VECTORS.down).toEqual({ x: 0, y: -1 });
  });
});
