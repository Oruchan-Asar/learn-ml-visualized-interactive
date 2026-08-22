"use client";

import { Hook, Intuition, Summary } from "@/components/chapter/Beats";
import { getChapterMeta } from "@/lib/curriculum";

export function PlaceholderContent({ slug }: { slug: string }) {
  const meta = getChapterMeta(slug);

  return (
    <>
      <Hook>
        How does <strong>{meta.title}</strong> push machine learning forward?
      </Hook>

      <Intuition>
        <p>{meta.blurb}</p>
        <p style={{ marginTop: "1rem", color: "var(--text-muted, #666)", fontSize: "0.95rem" }}>
          Interactive visualizations and mathematical simulations for this chapter are currently in development as part of the Zero-to-Hero Roadmap.
        </p>
      </Intuition>

      <Summary>
        <strong>{meta.title}</strong> is part of <em>{meta.part}</em>. Check back soon for interactive playgrounds and checkpoint challenges!
      </Summary>
    </>
  );
}
