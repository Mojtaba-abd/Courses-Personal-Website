"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-darker-bg text-text-primary">
      <div className="container mx-auto px-5 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-secondary-old transition-colors">
              <i className="fas fa-arrow-right" />
              <span>العودة للصفحة الرئيسية</span>
            </Link>
          </div>
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-cyber bg-clip-text text-transparent">
              <i className="fas fa-graduation-cap ml-4 text-secondary-old" /> الكورسات المتوفرة
            </h1>
            <p className="text-text-secondary text-lg">
              استكشف جميع دوراتنا التعليمية المتاحة
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">لا توجد دورات متاحة حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Link key={course._id} href={`/courses/${course._id}`}>
                  <div className="overflow-hidden transition-all hover:-translate-y-2.5 hover:shadow-glow bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl">
                    {course.featuredImage && (
                      <div className="w-full h-48 bg-gradient-cyber flex items-center justify-center text-5xl text-white/30 relative overflow-hidden">
                        <Image
                          src={course.featuredImage}
                          alt={course.title}
                          fill
                          sizes="100vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-darker-bg" />
                      </div>
                    )}
                    <div className="p-6">
                      {course.category && (
                        <span className="inline-block px-3 py-1 rounded-full bg-gradient-2 text-white text-xs mb-3">
                          {course.category}
                        </span>
                      )}
                      <h2 className="text-xl font-semibold mb-4 text-white line-clamp-2">
                        {course.title}
                      </h2>
                      {course.description && (
                        <p className="text-sm text-text-secondary mb-4 line-clamp-3 flex-1">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto mb-4">
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <i className="fas fa-book text-secondary-old" />
                          <span>دورة تدريبية</span>
                        </div>
                        <span className="text-md font-medium text-secondary-old">
                          {formatPrice(course.price)}
                        </span>
                      </div>
                      <div className="px-6 py-3 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm text-center transition-colors">
                        عرض التفاصيل
                      </div>
                    </div>
                  </div>
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

