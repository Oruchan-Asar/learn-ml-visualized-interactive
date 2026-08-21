import { trainLora, loraLoss, outerProduct, LORA_START, TARGET_DELTA_W, LORA_PARAM_COUNT, FULL_FINE_TUNE_PARAM_COUNT } from "./lora-and-parameter-efficient-fine-tuning";
import { inContextAnswer, DOUBLE_DEMOS, NEGATE_DEMOS, QUERY_X, type Demonstration } from "./prompting-and-in-context-learning";
import { workWithoutCache, workWithCache, speedupRatio } from "./inference-optimization-and-deployment";

export { LORA_PARAM_COUNT, FULL_FINE_TUNE_PARAM_COUNT, DOUBLE_DEMOS, NEGATE_DEMOS, QUERY_X, TARGET_DELTA_W };
export type { Demonstration };

/**
 * Three mechanisms from this part, chained into one shippable assistant: a LoRA-adapted frozen
 * backbone (Chapter 1) provides the base capability, a system prompt steers its behavior per
 * request with no further training (Chapter 4), and a KV cache keeps serving many such requests
 * cheap (Chapter 5).
 */
export function fineTuneBackbone(steps = 100, learningRate = 0.02) {
  const trace = trainLora(steps, learningRate, LORA_START);
  const final = trace[trace.length - 1];
  return { final, loss: loraLoss(final), approximation: outerProduct(final.a, final.b) };
}

export function respond(systemPromptDemos: Demonstration[], query: number = QUERY_X) {
  return inContextAnswer(systemPromptDemos, query);
}

export interface ServingPlan {
  requests: number;
  tokensPerResponse: number;
  totalWorkWithoutCache: number;
  totalWorkWithCache: number;
  speedup: number;
}

export function planServing(requests: number, tokensPerResponse: number): ServingPlan {
  const perRequestWithoutCache = workWithoutCache(tokensPerResponse);
  const perRequestWithCache = workWithCache(tokensPerResponse);
  return {
    requests,
    tokensPerResponse,
    totalWorkWithoutCache: requests * perRequestWithoutCache,
    totalWorkWithCache: requests * perRequestWithCache,
    speedup: speedupRatio(tokensPerResponse),
  };
}

export interface AssistantResult {
  backboneLoss: number;
  backboneMatchesTarget: boolean;
  systemPrompt: "double" | "negate";
  answer: number;
  serving: ServingPlan;
}

export function runAssistant(systemPrompt: "double" | "negate", requests: number, tokensPerResponse: number): AssistantResult {
  const backbone = fineTuneBackbone();
  const demos = systemPrompt === "double" ? DOUBLE_DEMOS : NEGATE_DEMOS;
  const response = respond(demos);
  return {
    backboneLoss: backbone.loss,
    backboneMatchesTarget: backbone.loss < 1e-10,
    systemPrompt,
    answer: response.answer,
    serving: planServing(requests, tokensPerResponse),
  };
}
