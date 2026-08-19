export interface ChapterMeta {
  slug: string;
  part: string;
  chapterNumber: number;
  title: string;
  blurb: string;
}

/** Single source of truth for reading order — the home page, chapter headers, and prev/next nav all derive from this. */
export const CURRICULUM: ChapterMeta[] = [
  {
    slug: "what-is-a-gradient",
    part: "Part I — Foundations",
    chapterNumber: 1,
    title: "What is a gradient?",
    blurb:
      "Drag a point along a curve, watch the tangent line, and find the exact spot where the gradient hits zero.",
  },
  {
    slug: "gradient-descent",
    part: "Part I — Foundations",
    chapterNumber: 2,
    title: "Gradient descent",
    blurb:
      "Take steps against the gradient, tune the learning rate, and see exactly how it can overshoot or diverge.",
  },
  {
    slug: "the-chain-rule",
    part: "Part I — Foundations",
    chapterNumber: 3,
    title: "The chain rule",
    blurb:
      "Drag a point through two linked curves and watch two slopes multiply into the slope of the whole chain.",
  },
];

export function getChapterMeta(slug: string): ChapterMeta {
  const meta = CURRICULUM.find((c) => c.slug === slug);
  if (!meta) throw new Error(`Unknown chapter slug: ${slug}`);
  return meta;
}

export interface ChapterNeighbors {
  index: number;
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
}

export function getChapterNeighbors(slug: string): ChapterNeighbors {
  const index = CURRICULUM.findIndex((c) => c.slug === slug);
  return {
    index,
    prev: index > 0 ? CURRICULUM[index - 1] : null,
    next: index >= 0 && index < CURRICULUM.length - 1 ? CURRICULUM[index + 1] : null,
  };
}
