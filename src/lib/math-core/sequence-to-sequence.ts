/**
 * An encoder RNN reads a 3-token input sequence, compressing everything into one final
 * hidden state (the "context vector"). A separate decoder RNN then starts from that single
 * vector and unrolls a sequence of its own — 2 steps here — with no requirement that the two
 * lengths match. That decoupling is the whole point of encoder-decoder over a single shared RNN.
 */
export const ENCODER_WX = 1;
export const ENCODER_WH = 0.5;
export const INPUT_SEQUENCE: number[] = [1, -1, 1];

export function encoderTrace(inputs: number[] = INPUT_SEQUENCE, wx: number = ENCODER_WX, wh: number = ENCODER_WH): number[] {
  const trace: number[] = [];
  let h = 0;
  for (const x of inputs) {
    h = Math.tanh(wx * x + wh * h);
    trace.push(h);
  }
  return trace;
}

/** The context vector handed from encoder to decoder: just the encoder's final hidden state. */
export function context(inputs: number[] = INPUT_SEQUENCE, wx: number = ENCODER_WX, wh: number = ENCODER_WH): number {
  const trace = encoderTrace(inputs, wx, wh);
  return trace[trace.length - 1];
}

export const DECODER_WC = 1;
export const DECODER_WG = 0.5;
export const OUTPUT_LENGTH = 2;

/**
 * The decoder never sees the input sequence again — only the single context vector. Its first
 * step reads the context directly; every step after that only sees its own previous output.
 */
export function decode(ctx: number, steps: number = OUTPUT_LENGTH, wc: number = DECODER_WC, wg: number = DECODER_WG): number[] {
  const outputs: number[] = [];
  let g = Math.tanh(wc * ctx);
  outputs.push(g);
  for (let t = 1; t < steps; t++) {
    g = Math.tanh(wg * g);
    outputs.push(g);
  }
  return outputs;
}

export interface SeqToSeqResult {
  encoderStates: number[];
  context: number;
  outputs: number[];
}

export function runSeqToSeq(inputs: number[] = INPUT_SEQUENCE, outputSteps: number = OUTPUT_LENGTH): SeqToSeqResult {
  const encoderStates = encoderTrace(inputs);
  const ctx = encoderStates[encoderStates.length - 1];
  const outputs = decode(ctx, outputSteps);
  return { encoderStates, context: ctx, outputs };
}
