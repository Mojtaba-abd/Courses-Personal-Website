"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Categories } from "@/app/(dashboard)/(routes)/search/_components/categories";
import { SearchInput } from "@/components/search-input";
import { useAuth } from "@/hooks/use-auth";
import { getCourses } from "@/actions/get-courses";
import { CoursesList } from "@/components/courses-list";
import { Loader2 } from "lucide-react";

interface SearchPageProps {
  searchParams: { 
    title?: string;
    categoryId: string;
  };
}

const CoursesPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<{ title?: string; categoryId?: string }>({});

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [categoriesData, coursesData] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000"}/api/category`),
            getCourses({ userId: user.id, ...searchParams })
          ]);
          
          setCategories(categoriesData.data);
          setCourses(coursesData);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [user, searchParams]);

  if (authLoading || isLoading || !user) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="px-6 pt-6 md:hidden md:mb-0 block">
        <SearchInput /> 
      </div>
      <div className="p-6">
        <Categories items={categories} />
        <CoursesList items={courses} />
      </div>
    </>
  );
};

export default CoursesPage;

