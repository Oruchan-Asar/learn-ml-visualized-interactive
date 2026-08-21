/**
 * A single tool call answers one question. ReAct chains several: think about what to do, act (call a
 * tool), observe the result, and think again in light of what came back — looping until an answer is
 * reached. The loop's real value shows up when the first thought is wrong: the observation that follows
 * an action can correct it before a final answer is ever given.
 */
export const LOCATION: Record<string, string> = {
  "Eiffel Tower": "France",
  Colosseum: "Italy",
  "Statue of Liberty": "USA",
};

export const CAPITAL: Record<string, string> = {
  France: "Paris",
  Italy: "Rome",
  USA: "Washington, D.C.",
  Germany: "Berlin",
  Greece: "Athens",
};

/** A plausible but wrong first guess at each landmark's country — wrong for an understandable reason, not arbitrarily. */
export const NAIVE_GUESS: Record<string, string> = {
  "Eiffel Tower": "Germany",
  Colosseum: "Greece",
  "Statue of Liberty": "France", // a gift FROM France — an understandable, still-wrong association
};

export interface ReActTrace {
  thought1: string;
  action1: string;
  observation1: string;
  thought2: string;
  action2: string;
  observation2: string;
  finalAnswer: string;
  naiveAnswer: string;
  corrected: boolean;
}

/** Runs the two-hop ReAct loop for one landmark: guess a country, look it up, correct if wrong, then look up its capital. */
export function runReAct(landmark: string): ReActTrace {
  const naiveCountry = NAIVE_GUESS[landmark];
  const trueCountry = LOCATION[landmark];
  const naiveAnswer = CAPITAL[naiveCountry];
  const trueCapital = CAPITAL[trueCountry];

  return {
    thought1: `I think ${landmark} is in ${naiveCountry}, so I need ${naiveCountry}'s capital.`,
    action1: `look_up_location("${landmark}")`,
    observation1: trueCountry,
    thought2:
      trueCountry === naiveCountry
        ? `Confirmed — ${landmark} is in ${trueCountry}. I need ${trueCountry}'s capital.`
        : `${landmark} is actually in ${trueCountry}, not ${naiveCountry}. I need ${trueCountry}'s capital instead.`,
    action2: `look_up_capital("${trueCountry}")`,
    observation2: trueCapital,
    finalAnswer: trueCapital,
    naiveAnswer,
    corrected: trueCountry !== naiveCountry,
  };
}

export const LANDMARKS = Object.keys(LOCATION);
