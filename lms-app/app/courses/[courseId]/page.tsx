import { notFound } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface Chapter {
  _id: string;
  title: string;
  position: number;
  isFree: boolean;
}

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

const CoursePage = async ({ params }: CoursePageProps) => {
  const API_URL = process.env.BACK_END_URL || "http://localhost:8000";

  try {
    const course = await axios.get(`${API_URL}/api/courses/${params.courseId}`).then((res) => res.data);

    // Check if course is published
    if (!course.isPublished && !course.published) {
      return notFound();
    }

    // Fetch chapters
    const chapters: Chapter[] = await axios
      .get(`${API_URL}/api/chapters/${params.courseId}/published`)
      .then((res) => res.data)
      .catch(() => []);

    const sortedChapters = chapters.sort((a, b) => a.position - b.position);

    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative w-full h-96 bg-gradient-to-br from-primary/20 to-primary/5">
          {course.featuredImage && (
            <div className="absolute inset-0">
              <Image
                src={course.featuredImage}
                alt={course.title}
                fill
                className="object-cover opacity-20"
              />
            </div>
          )}
          <div className="relative container mx-auto px-4 py-16 h-full flex flex-col justify-end">
            <div className="max-w-4xl">
              {course.category && (
                <Badge variant="secondary" className="mb-4 capitalize">
                  {course.category}
                </Badge>
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
              {course.description && (
                <p className="text-lg text-muted-foreground mb-6">{course.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {course.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                )}
                {course.level && (
                  <Badge variant="outline" className="capitalize">
                    {course.level}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedChapters.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No chapters available yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortedChapters.map((chapter, index) => (
                        <div
                          key={chapter._id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-semibold">{chapter.title}</h3>
                                {chapter.isFree && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    Free
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.price !== undefined && course.price > 0 ? (
                    <div>
                      <p className="text-3xl font-bold">${course.price}</p>
                      <p className="text-sm text-muted-foreground">One-time payment</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-green-600">Free</p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <Button className="w-full" size="lg">
                      {course.price && course.price > 0 ? "Enroll Now" : "Get Started"}
                    </Button>
                    <Button variant="outline" className="w-full">
                      Request Access
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    {course.instructor && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Instructor</span>
                        <span className="font-medium">{course.instructor}</span>
                      </div>
                    )}
                    {course.level && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Level</span>
                        <span className="font-medium capitalize">{course.level}</span>
                      </div>
                    )}
                    {course.duration && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{course.duration}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching course:", error);
    return notFound();
  }
};

export default CoursePage;

