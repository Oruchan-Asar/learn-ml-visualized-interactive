import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import { getChapterMeta } from "@/lib/curriculum";
import ChapterContent from "@/content/part-8-classical-ml-continued/collaborative-filtering-and-matrix-factorization/ClientContent";

const SLUG = "collaborative-filtering-and-matrix-factorization";

export const metadata: Metadata = {
  title: `${getChapterMeta(SLUG).title} — Gradient`,
};

export default function Page() {
  return (
    <ChapterFrame slug={SLUG}>
      <ChapterContent />
    </ChapterFrame>
  );
}
