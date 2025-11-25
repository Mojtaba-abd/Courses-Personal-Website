"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/app/(dashboard)/(routes)/teacher/courses/_components/data-table";
import { createColumns } from "@/app/(dashboard)/(routes)/teacher/courses/_components/columns";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2 } from "lucide-react";

const CoursesPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000"}/api/courses`,
        { withCredentials: true }
      );
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  // Refetch when page becomes visible (e.g., after navigation back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        fetchCourses();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  if (isLoading || isLoadingCourses || !user) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const columns = createColumns(fetchCourses);

  return (
    <div className="p-6">
      <DataTable columns={columns} data={courses} />
    </div>
  );
};

export default CoursesPage;

