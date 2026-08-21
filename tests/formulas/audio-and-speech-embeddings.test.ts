import { describe, it, expect } from "vitest";
import { findItem, rankByModality, nearestOfModality } from "@/lib/math-core/audio-and-speech-embeddings";

describe("audio-and-speech-embeddings", () => {
  it("dog barking retrieves the dog image and the dog caption, both by a wide margin", () => {
    const dogAudio = findItem("Audio: a dog barking");
    expect(nearestOfModality(dogAudio, "image").label).toBe("Image: dog");
    expect(nearestOfModality(dogAudio, "text").label).toBe("Caption: a dog running");
    const toImage = rankByModality(dogAudio, "image");
    expect(toImage[0].d).toBeCloseTo(0.22360679774997919, 10);
    expect(toImage[1].d).toBeGreaterThan(toImage[0].d * 10);
  });

  it("cat meowing retrieves the cat image, not the dog or bird", () => {
    const catAudio = findItem("Audio: a cat meowing");
    expect(nearestOfModality(catAudio, "image").label).toBe("Image: cat");
    const ranked = rankByModality(catAudio, "image");
    expect(ranked.map((r) => r.item.label)).toEqual(["Image: cat", "Image: dog", "Image: bird"]);
  });

  it("bird chirping retrieves the bird caption, not the dog or cat caption", () => {
    const birdAudio = findItem("Audio: a bird chirping");
    expect(nearestOfModality(birdAudio, "text").label).toBe("Caption: a bird flying");
    expect(rankByModality(birdAudio, "text")[0].d).toBeCloseTo(0.5385164807134505, 10);
  });

  it("every audio item sits closer to its own cluster than to either other cluster", () => {
    for (const label of ["Audio: a dog barking", "Audio: a cat meowing", "Audio: a bird chirping"]) {
      const audio = findItem(label);
      const imageRanks = rankByModality(audio, "image");
      const textRanks = rankByModality(audio, "text");
      expect(imageRanks[0].d).toBeLessThan(imageRanks[1].d);
      expect(textRanks[0].d).toBeLessThan(textRanks[1].d);
    }
  });
});
