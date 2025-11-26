"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Loader2, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Course {
  _id: string;
  title: string;
  description?: string;
  featuredImage?: string;
  category?: string;
  price?: number;
  isPublished?: boolean;
  published?: boolean;
}

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses/public`, { withCredentials: false });
      // Filter for published courses
      const publishedCourses = (response.data || []).filter(
        (course: Course) => course.isPublished || course.published === true
      );
      setCourses(publishedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "مجاني";
    return `${price} د.ع`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">الدورات</h1>
            <p className="text-muted-foreground text-lg">
              استكشف جميع دوراتنا التعليمية المتاحة
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد دورات متاحة حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course._id} href={`/courses/${course._id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                    {course.featuredImage && (
                      <div className="relative w-full h-48 bg-muted">
                        <Image
                          src={course.featuredImage}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-6 flex-1 flex flex-col">
                      {course.category && (
                        <Badge variant="secondary" className="mb-2 w-fit">
                          {course.category}
                        </Badge>
                      )}
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                        {course.title}
                      </h2>
                      {course.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>دورة تدريبية</span>
                        </div>
                        <span className="text-md font-medium">
                          {formatPrice(course.price)}
                        </span>
                      </div>
                      <Link href={`/courses/${course._id}`} className="mt-4">
                        <Button className="w-full">عرض التفاصيل</Button>
                      </Link>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;

