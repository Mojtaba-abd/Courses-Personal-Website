"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  const [hasLastViewed, setHasLastViewed] = useState(false);

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

        // If enrolled, find lesson URL for "Start Learning" or "Continue Learning" button
        // Check for last viewed lesson first, then fall back to first lesson
        if (userEnrolled) {
          try {
            let targetLessonUrl: string | null = null;
            let hasLastViewedLesson = false;

            // Check for last viewed lesson in localStorage
            try {
              const lastViewedKey = `lastViewed_${courseId}_${user.id}`;
              const lastViewedData = localStorage.getItem(lastViewedKey);
              
              if (lastViewedData) {
                const lastViewed = JSON.parse(lastViewedData);
                
                // Verify the lesson still exists
                try {
                  const lessonCheck = await axios.get(
                    `${API_URL}/api/lessons/${lastViewed.lessonId}/chapter/${lastViewed.chapterId}`,
                    { withCredentials: true }
                  );
                  
                  if (lessonCheck.data) {
                    targetLessonUrl = `/courses/${courseId}/chapters/${lastViewed.chapterId}/lessons/${lastViewed.lessonId}`;
                    hasLastViewedLesson = true;
                    console.log("Found last viewed lesson:", targetLessonUrl);
                  }
                } catch {
                  // Lesson might have been deleted, will fall back to first lesson
                  console.log("Last viewed lesson no longer exists, using first lesson");
                }
              }
            } catch {
              // Invalid data in localStorage, will fall back to first lesson
              console.log("Error reading last viewed lesson from localStorage");
            }

            // If no last viewed lesson, find first lesson
            if (!targetLessonUrl) {
              let chapters = courseData.chapters || [];
              
              // If chapters not populated in response, fetch them separately
              if (!chapters || chapters.length === 0) {
                const chaptersRes = await axios.get(`${API_URL}/api/chapters/${courseId}/published`);
                chapters = chaptersRes.data || [];
              }

              if (chapters.length > 0) {
                // Sort chapters by position
                const sortedChapters = chapters.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                const firstChapter = sortedChapters[0];
                
                // Check if lessons are already populated in chapter object
                let lessons = firstChapter.lessons || [];
                
                // If lessons not populated, fetch them separately
                if (!lessons || lessons.length === 0) {
                  const lessonsRes = await axios.get(`${API_URL}/api/lessons/chapter/${firstChapter._id}`);
                  lessons = lessonsRes.data || [];
                }
                
                // Sort lessons by position
                const sortedLessons = lessons.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                
                if (sortedLessons.length > 0) {
                  targetLessonUrl = `/courses/${courseId}/chapters/${firstChapter._id}/lessons/${sortedLessons[0]._id}`;
                }
              }
            }

            setFirstLessonUrl(targetLessonUrl);
            setHasLastViewed(hasLastViewedLesson);
          } catch (error) {
            console.error("Error fetching lesson URL:", error);
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
      <div className="min-h-screen bg-darker-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-old" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-darker-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-white">قريباً</h1>
          <p className="text-text-secondary">هذه الدورة غير متاحة حالياً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darker-bg text-text-primary">
      <div className="container mx-auto px-5 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-secondary-old transition-colors mb-4">
          <i className="fas fa-arrow-right" />
          <span>العودة للصفحة الرئيسية</span>
        </Link>
      </div>
      {/* Hero Section */}
      <div className="relative w-full h-96 bg-gradient-cyber">
        {course.featuredImage && (
          <div className="absolute inset-0">
            <Image
              src={course.featuredImage}
              alt={course.title}
              fill
              sizes="100vw"
              className="object-cover opacity-20"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-darker-bg" />
        <div className="relative container mx-auto px-5 py-16 h-full flex flex-col justify-end">
          <div className="max-w-4xl">
            {course.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-gradient-2 text-white text-xs mb-4">
                {course.category}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{course.title}</h1>
            {course.description && (
              <p className="text-lg text-text-secondary mb-6">{course.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              {course.duration && (
                <div className="flex items-center gap-2">
                  <i className="fas fa-clock text-secondary-old" />
                  <span>{course.duration}</span>
                </div>
              )}
              {course.level && (
                <span className="px-3 py-1 rounded-full bg-glass-bg border border-glass-border capitalize">
                  {course.level}
                </span>
              )}
              {isEnrolled && (
                <span className="px-3 py-1 rounded-full bg-green-600 text-white">
                  مسجل
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-5 py-8">
        <div className="max-w-md mx-auto">
            <div className="sticky top-4 p-6 bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 text-white">تفاصيل الدورة</h2>
              <div className="h-px bg-glass-border mb-6" />

                <div className="space-y-3 mb-6">
                  {isEnrolled ? (
                    <button
                      className="w-full px-6 py-3 rounded-[50px] bg-green-600 hover:bg-green-700 text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                      onClick={() => {
                        if (firstLessonUrl) {
                          router.push(firstLessonUrl);
                        } else {
                          toast("لا توجد دروس متاحة حالياً");
                        }
                      }}
                    >
                      <i className="fas fa-play" /> {hasLastViewed ? "متابعة التعلم" : "ابدأ التعلم"}
                    </button>
                  ) : (
                    <button
                      className="w-full px-6 py-3 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <i className="fas fa-user-plus" /> طلب الالتحاق
                    </button>
                  )}
                </div>

                <div className="h-px bg-glass-border mb-6" />

                <div className="space-y-3 text-sm">
                  {course.instructor && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">المدرب</span>
                      <span className="font-medium text-white">{course.instructor}</span>
                    </div>
                  )}
                  {course.level && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">المستوى</span>
                      <span className="font-medium text-white capitalize">{course.level}</span>
                    </div>
                  )}
                  {course.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">المدة</span>
                      <span className="font-medium text-white">{course.duration}</span>
                    </div>
                  )}
                </div>
            </div>
        </div>
      </div>

      {/* Request Access Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">طلب الالتحاق</DialogTitle>
            <DialogDescription className="text-text-secondary">
              املأ النموذج أدناه لطلب الالتحاق بهذه الدورة. سنتواصل معك قريباً.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">الاسم *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="الاسم الكامل"
                  required
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+964 786 900 1400"
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-white">الرسالة (اختياري)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="أخبرنا لماذا أنت مهتم بهذه الدورة..."
                  rows={4}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
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
                className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال الطلب"
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
