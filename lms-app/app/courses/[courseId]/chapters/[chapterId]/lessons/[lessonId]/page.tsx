"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Play, Download, FileText, Clock, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import Image from "next/image";

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
  courseId: string;
}

interface Course {
  _id: string;
  title: string;
  enrolledUsers: string[];
}

const LessonPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;
  const lessonId = params.lessonId as string;
  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";
  const { user, isLoading: authLoading } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [chaptersWithLessons, setChaptersWithLessons] = useState<Array<{ chapter: Chapter; lessons: Lesson[] }>>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [courseId, chapterId, lessonId, user, authLoading]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch course and check enrollment
      const courseRes = await axios.get(`${API_URL}/api/courses/${courseId}`, {
        withCredentials: true,
      });
      const courseData = courseRes.data;
      setCourse(courseData);

      // Check enrollment
      if (user?.id) {
        const enrolledUsers = courseData.enrolledUsers || [];
        const userEnrolled = enrolledUsers.some((id: string) => id.toString() === user.id.toString());
        setIsEnrolled(userEnrolled);

        if (!userEnrolled) {
          toast.error("You are not enrolled in this course");
          router.push(`/courses/${courseId}`);
          return;
        }
      } else {
        toast.error("Please login to access course content");
        router.push(`/courses/${courseId}`);
        return;
      }

      // Fetch chapter
      const chapterRes = await axios.get(`${API_URL}/api/chapters/${chapterId}/course/${courseId}`);
      setChapter(chapterRes.data);

      // Fetch lesson
      const lessonRes = await axios.get(`${API_URL}/api/lessons/${lessonId}/chapter/${chapterId}`);
      setLesson(lessonRes.data);

      // Fetch all chapters and lessons for navigation
      const chaptersRes = await axios.get(`${API_URL}/api/chapters/${courseId}/published`);
      const chaptersData = chaptersRes.data.sort((a: Chapter, b: Chapter) => a.position - b.position);
      setAllChapters(chaptersData);

      const chaptersWithLessons = await Promise.all(
        chaptersData.map(async (ch: Chapter) => {
          try {
            const lessonsRes = await axios.get(`${API_URL}/api/lessons/chapter/${ch._id}`);
            const sortedLessons = (lessonsRes.data || []).sort((a: Lesson, b: Lesson) => a.position - b.position);
            return {
              chapter: ch,
              lessons: sortedLessons,
            };
          } catch {
            return { chapter: ch, lessons: [] };
          }
        })
      );

      // Flatten to get all lessons with their chapter info
      const lessonsList: Array<{ lesson: Lesson; chapter: Chapter }> = [];
      chaptersWithLessons.forEach(({ chapter: ch, lessons }) => {
        lessons.forEach((l: Lesson) => {
          lessonsList.push({ lesson: l, chapter: ch });
        });
      });

      setAllLessons(lessonsList.map((item) => item.lesson));

      // Find current lesson index
      const index = lessonsList.findIndex((item) => item.lesson._id === lessonId);
      setCurrentLessonIndex(index >= 0 ? index : 0);
    } catch (error: any) {
      console.error("Error fetching lesson:", error);
      toast.error(error.response?.data?.error || "Failed to load lesson");
      router.push(`/courses/${courseId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  const navigateToLesson = async (index: number) => {
    if (index < 0 || index >= allLessons.length) return;

    const targetLesson = allLessons[index];
    
    // Find which chapter this lesson belongs to
    for (const ch of allChapters) {
      try {
        const lessonsRes = await axios.get(`${API_URL}/api/lessons/chapter/${ch._id}`);
        const hasLesson = lessonsRes.data.some((l: Lesson) => l._id === targetLesson._id);
        if (hasLesson) {
          router.push(`/courses/${courseId}/chapters/${ch._id}/lessons/${targetLesson._id}`);
          return;
        }
      } catch {}
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson || !chapter || !course || !isEnrolled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You need to be enrolled to view this lesson.</p>
          <Button onClick={() => router.push(`/courses/${courseId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  const videoEmbedUrl = getYouTubeEmbedUrl(lesson.videoUrl);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/courses/${courseId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-lg font-semibold">{course.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {chapter.title} • Lesson {currentLessonIndex + 1} of {allLessons.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{lesson.title}</CardTitle>
                {lesson.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{lesson.duration}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video */}
                {videoEmbedUrl && (
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={videoEmbedUrl}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}

                {/* Description */}
                {lesson.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{lesson.description}</p>
                  </div>
                )}

                {/* Content */}
                {lesson.content && (
                  <div>
                    <h3 className="font-semibold mb-2">Content</h3>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: lesson.content }}
                    />
                  </div>
                )}

                {/* Attachments */}
                {lesson.attachments && lesson.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Attachments
                    </h3>
                    <div className="space-y-2">
                      {lesson.attachments.map((attachment, idx) => (
                        <a
                          key={idx}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Download className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{attachment.name || `Attachment ${idx + 1}`}</p>
                            <p className="text-xs text-muted-foreground">{attachment.type || "File"}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => navigateToLesson(currentLessonIndex - 1)}
                disabled={currentLessonIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous Lesson
              </Button>
              <Button
                variant="outline"
                onClick={() => navigateToLesson(currentLessonIndex + 1)}
                disabled={currentLessonIndex >= allLessons.length - 1}
              >
                Next Lesson
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </div>
          </div>

          {/* Sidebar - Lesson List */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-base">Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {allChapters.map((ch) => {
                    // Get lessons for this chapter by fetching them
                    const [chapterLessons, setChapterLessons] = useState<Lesson[]>([]);
                    
                    useEffect(() => {
                      axios.get(`${API_URL}/api/lessons/chapter/${ch._id}`)
                        .then((res) => {
                          const sorted = (res.data || []).sort((a: Lesson, b: Lesson) => a.position - b.position);
                          setChapterLessons(sorted);
                        })
                        .catch(() => setChapterLessons([]));
                    }, [ch._id]);

                    return (
                      <ChapterLessonsList
                        key={ch._id}
                        chapter={ch}
                        courseId={courseId}
                        currentLessonId={lessonId}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;


