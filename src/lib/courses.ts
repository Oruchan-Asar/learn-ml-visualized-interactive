import { CURRICULUM, type ChapterMeta } from "./curriculum";
import { DS_CURRICULUM } from "./decentralized-systems-curriculum";

export interface CourseInfo {
  slug: string;
  title: string;
  eyebrow: string;
  blurb: string;
  homeHref: string;
  chapterBasePath: string;
  glossaryHref?: string;
  curriculum: ChapterMeta[];
}

export const COURSES: CourseInfo[] = [
  {
    slug: "ml-zero-to-hero",
    title: "Zero to Hero: Machine Learning & AI",
    eyebrow: "Gradient · Phase 1",
    blurb:
      "Machine learning, deep learning, explainable AI, and multimodal AI — every formula visualized, every chapter tested.",
    homeHref: "/ml",
    chapterBasePath: "/chapter",
    glossaryHref: "/glossary",
    curriculum: CURRICULUM,
  },
  {
    slug: "decentralized-systems",
    title: "Decentralized Systems",
    eyebrow: "Gradient · Master's Coursework",
    blurb:
      "Consensus, replication, and trust without a central coordinator — from vector clocks to blockchains, every protocol traced step by step.",
    homeHref: "/decentralized-systems",
    chapterBasePath: "/decentralized-systems/chapter",
    curriculum: DS_CURRICULUM,
  },
];

export function getCourse(slug: string): CourseInfo {
  const course = COURSES.find((c) => c.slug === slug);
  if (!course) throw new Error(`Unknown course slug: ${slug}`);
  return course;
}
