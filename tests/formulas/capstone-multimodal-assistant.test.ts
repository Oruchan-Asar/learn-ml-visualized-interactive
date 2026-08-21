import { describe, it, expect } from "vitest";
import { runAssistant, AUDIO_LABELS } from "@/lib/math-core/capstone-multimodal-assistant";

describe("capstone-multimodal-assistant", () => {
  it("has all three audio clips available as pipeline inputs", () => {
    expect(AUDIO_LABELS).toHaveLength(3);
    expect(AUDIO_LABELS).toContain("Audio: a dog barking");
  });

  it("dog barking retrieves the dog caption and generates a dog-conditioned value", () => {
    const result = runAssistant("Audio: a dog barking");
    expect(result.retrievedCaption).toBe("Caption: a dog running");
    expect(result.generatedValue).toBeCloseTo(2.789001727285007, 12);
  });

  it("cat meowing retrieves the cat caption and generates a cat-conditioned value", () => {
    const result = runAssistant("Audio: a cat meowing");
    expect(result.retrievedCaption).toBe("Caption: a cat sleeping");
    expect(result.generatedValue).toBeCloseTo(4.330072361116913, 12);
  });

  it("bird chirping retrieves the bird caption and generates a bird-conditioned value", () => {
    const result = runAssistant("Audio: a bird chirping");
    expect(result.retrievedCaption).toBe("Caption: a bird flying");
    expect(result.generatedValue).toBeCloseTo(3.8660549728150646, 12);
  });

  it("three different audio inputs produce three different generated values from the same pipeline", () => {
    const dog = runAssistant("Audio: a dog barking").generatedValue;
    const cat = runAssistant("Audio: a cat meowing").generatedValue;
    const bird = runAssistant("Audio: a bird chirping").generatedValue;
    expect(new Set([dog, cat, bird]).size).toBe(3);
  });
});
