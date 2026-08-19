import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import ChapterContent from "@/content/part-1-foundations/gradient-descent/ClientContent";

export const metadata: Metadata = {
  title: "Gradient descent — Gradient",
};

export default function Page() {
  return (
    <ChapterFrame partLabel="Part I — Foundations" chapterNumber={2} title="Gradient descent">
      <ChapterContent />
    </ChapterFrame>
  );
}
