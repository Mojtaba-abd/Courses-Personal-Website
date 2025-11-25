"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";

const CourseIdPage = () => {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const courseId = params.courseId as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && courseId) {
      const fetchCourse = async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";
          const response = await axios.get(
            `${API_URL}/api/courses/${courseId}`,
            { withCredentials: true }
          );
          setCourse(response.data);
        } catch (error) {
          console.error("Error fetching course:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCourse();
    }
  }, [user, courseId, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Course not found</h1>
        <p className="text-muted-foreground mt-2">The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{course.title || "Untitled Course"}</h1>
        <div className="bg-muted rounded-lg p-6">
          <p className="text-lg text-muted-foreground">
            Course edit page coming soon. Course ID: {courseId}
          </p>
          {course.description && (
            <p className="mt-4 text-sm">{course.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseIdPage;

