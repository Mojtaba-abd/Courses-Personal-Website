"use client";

import { useEffect, useState } from "react";
import { GetDashboardCourses } from "@/actions/get-dashboard-courses";
import { CoursesList } from "@/components/courses-list";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle, Clock } from "lucide-react";
import { InfoCard } from "@/app/(dashboard)/(routes)/(root)/_components/info-card";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [courses, setCourses] = useState<{
    completedCourses: any[];
    courseInProgress: any[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      const fetchCourses = async () => {
        const data = await GetDashboardCourses(user.id);
        setCourses(data);
      };
      fetchCourses();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!courses) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 bg-[#0f0f0f] min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard
          icon={Clock}
          label="In Progress"
          numberOfItems={courses.courseInProgress.length}
        />
        <InfoCard
          icon={CheckCircle}
          label="Completed"
          numberOfItems={courses.completedCourses.length}
          variant="success"
        />
      </div>
      <CoursesList items={[...courses.completedCourses, ...courses.courseInProgress]} />
    </div>
  );
}

