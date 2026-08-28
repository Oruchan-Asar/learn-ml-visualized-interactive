import styles from "./page.module.css";
import { COURSES } from "@/lib/courses";
import { CourseCard } from "./CourseCard";

export default function CoursesHub() {
  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <span className={styles.eyebrow}>Gradient</span>
        <h1 className={styles.title}>Every course, one visualized chapter at a time.</h1>
        <p className={styles.subtitle}>
          A personal learning platform — machine learning, and everything else on the syllabus this semester.
        </p>
      </header>

      <div className={styles.courseList}>
        {COURSES.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>
    </div>
  );
}
