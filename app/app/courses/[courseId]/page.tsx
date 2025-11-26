"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Play } from "lucide-react";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Lesson {
  _id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl: string;
  duration: string;
  isFree: boolean;
  position: number;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface Chapter {
  _id: string;
  title: string;
  position: number;
  isFree: boolean;
  lessons?: Lesson[];
}

const CoursePage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";
  const { user, isLoading: authLoading } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [firstLessonUrl, setFirstLessonUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    fetchCourseData();
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      const courseRes = await axios.get(`${API_URL}/api/courses/${courseId}`, {
        withCredentials: true,
      });
      const courseData = courseRes.data;

      // Check if course is published
      if (!courseData.isPublished && !courseData.published) {
        setCourse(null);
        setIsLoading(false);
        return;
      }

      setCourse(courseData);

      // Check if user is enrolled
      if (user?.id) {
        const enrolledUsers = courseData.enrolledUsers || [];
        const userEnrolled = enrolledUsers.some((id: string) => id.toString() === user.id.toString());
        setIsEnrolled(userEnrolled);

        // If enrolled, find first lesson URL for "Start Learning" button
        // Use populated chapters from course data if available, otherwise fetch separately
        if (userEnrolled) {
          try {
            console.log("User is enrolled, looking for first lesson...");
            console.log("Course data chapters:", courseData.chapters);
            
            let chapters = courseData.chapters || [];
            
            // If chapters not populated in response, fetch them separately
            if (!chapters || chapters.length === 0) {
              console.log("Chapters not in course data, fetching separately...");
              const chaptersRes = await axios.get(`${API_URL}/api/chapters/${courseId}/published`);
              chapters = chaptersRes.data || [];
              console.log("Fetched chapters:", chapters.length);
            }

            if (chapters.length > 0) {
              // Sort chapters by position
              const sortedChapters = chapters.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
              const firstChapter = sortedChapters[0];
              console.log("First chapter:", firstChapter._id, firstChapter.title);
              
              // Check if lessons are already populated in chapter object
              let lessons = firstChapter.lessons || [];
              console.log("Lessons in chapter:", lessons.length);
              
              // If lessons not populated, fetch them separately
              if (!lessons || lessons.length === 0) {
                console.log("Lessons not in chapter, fetching separately...");
                const lessonsRes = await axios.get(`${API_URL}/api/lessons/chapter/${firstChapter._id}`);
                lessons = lessonsRes.data || [];
                console.log("Fetched lessons:", lessons.length);
              }
              
              // Sort lessons by position
              const sortedLessons = lessons.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
              
              if (sortedLessons.length > 0) {
                const firstLessonUrl = `/courses/${courseId}/chapters/${firstChapter._id}/lessons/${sortedLessons[0]._id}`;
                console.log("Setting first lesson URL:", firstLessonUrl);
                setFirstLessonUrl(firstLessonUrl);
              } else {
                console.log("No lessons found in first chapter");
              }
            } else {
              console.log("No chapters found");
            }
          } catch (error) {
            console.error("Error fetching first lesson:", error);
          }
        }
      } else {
        setIsEnrolled(false);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      setCourse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("الرجاء إدخال الاسم والبريد الإلكتروني");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/request-access`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        courseId: courseId,
        courseTitle: course?.title || "",
      });

      toast.success("تم إرسال طلبك بنجاح! سيتواصل معك قريبًا");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error.response?.data?.error || "حدث خطأ. يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Coming Soon</h1>
          <p className="text-muted-foreground">This course is not available yet.</p>
        </div>
      </div>
    );
  }

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
              {isEnrolled && (
                <Badge className="bg-green-600 text-white">
                  Enrolled
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />

                <div className="space-y-3">
                  {isEnrolled ? (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                      onClick={() => {
                        if (firstLessonUrl) {
                          router.push(firstLessonUrl);
                        } else {
                          toast("No lessons available yet");
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Learning
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Request Access
                    </Button>
                  )}
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

      {/* Request Access Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Access</DialogTitle>
            <DialogDescription>
              Fill out the form below to request access to this course. We'll get back to you soon.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us why you're interested in this course..."
                  rows={4}
                />
              </div>
              <input type="hidden" value={courseId} />
              <input type="hidden" value={course?.title || ""} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoursePage;
