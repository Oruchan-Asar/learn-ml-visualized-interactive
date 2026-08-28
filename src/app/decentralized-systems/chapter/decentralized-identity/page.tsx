import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import { CoursePlaceholderContent } from "@/components/chapter/CoursePlaceholderContent";
import { getCourse } from "@/lib/courses";

const COURSE = getCourse("decentralized-systems");
const SLUG = "decentralized-identity";
const META = COURSE.curriculum.find((c) => c.slug === SLUG)!;

export const metadata: Metadata = {
  title: `${META.title} — Gradient`,
};

export default function Page() {
  return (
    <ChapterFrame slug={SLUG} course={COURSE}>
      <CoursePlaceholderContent meta={META} />
    </ChapterFrame>
  );
}
