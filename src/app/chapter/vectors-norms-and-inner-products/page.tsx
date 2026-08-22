import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import { getChapterMeta } from "@/lib/curriculum";
import { PlaceholderContent } from "@/components/chapter/PlaceholderContent";

const SLUG = "vectors-norms-and-inner-products";

export const metadata: Metadata = {
  title: `${getChapterMeta(SLUG).title} — Gradient`,
};

export default function Page() {
  return (
    <ChapterFrame slug={SLUG}>
      <PlaceholderContent slug={SLUG} />
    </ChapterFrame>
  );
}
