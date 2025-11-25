// "use client";

import NavbarRoutes from "@/components/navbar-routes";
import { CourseMobileSidebar } from "./course-mobile-sidebar";

interface courseNavbarProps {
  course: {
    title: string,
    purchased:  { [key: string]: boolean }
  
  };
  chapters:  {_id: string,courseId: string, title: string, isCompleted: { [key: string] : boolean}, isFree: boolean, purchased: { [key: string] : boolean}}[]
  userId: string;
}

export const CourseNavbar = ({ course, chapters, userId }: courseNavbarProps) => {
  return (
    <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
        <CourseMobileSidebar
        course={course}
        chapters={chapters}
        userId={userId}
        // progressCount={progressCount}
        />
      <NavbarRoutes />
    </div>
  );
};
