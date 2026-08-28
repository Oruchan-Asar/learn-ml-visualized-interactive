"use client";

import { Hook, Intuition, Summary } from "@/components/chapter/Beats";
import type { ChapterMeta } from "@/lib/curriculum";

/** Course-agnostic placeholder — takes the chapter's metadata directly rather than looking it up. */
export function CoursePlaceholderContent({ meta }: { meta: ChapterMeta }) {
  return (
    <>
      <Hook>
        What does <strong>{meta.title}</strong> actually mean, and why does it matter?
      </Hook>

      <Intuition>
        <p>{meta.blurb}</p>
        <p style={{ marginTop: "1rem", color: "var(--text-muted, #666)", fontSize: "0.95rem" }}>
          Interactive visualizations and worked examples for this chapter are currently in development.
        </p>
      </Intuition>

      <Summary>
        <strong>{meta.title}</strong> is part of <em>{meta.part}</em>. Check back soon for interactive playgrounds and checkpoint challenges!
      </Summary>
    </>
  );
}
