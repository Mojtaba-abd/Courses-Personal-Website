"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Lesson {
  _id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl: string;
  duration: string;
  isFree: boolean;
  position: number;
  lessonType?: "video" | "text";
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
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);

  // Video protection - disable right-click and shortcuts (must be before any conditional returns)
  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => e.preventDefault();
    const disableShortcuts = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+U, Ctrl+S, Ctrl+C, Ctrl+Shift+I, Ctrl+P, Ctrl+A, etc.
      if (
        e.key === "F12" ||
        e.key === "F5" ||
        (e.ctrlKey &&
          (e.key === "u" ||
            e.key === "s" ||
            e.key === "c" ||
            e.key === "p" ||
            e.key === "a" ||
            e.key === "i" ||
            (e.shiftKey && e.key === "I"))) ||
        (e.metaKey && (e.key === "u" || e.key === "s" || e.key === "c"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Disable text selection
    document.addEventListener("selectstart", (e) => e.preventDefault());
    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("keydown", disableShortcuts);

    return () => {
      document.removeEventListener("selectstart", (e) => e.preventDefault());
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", disableShortcuts);
    };
  }, []);

  // YouTube Player API setup (must be before conditional returns)
  useEffect(() => {
    if (!lesson || !lesson.videoUrl) return;
    
    // Only initialize player for video lessons
    const lessonType = lesson.lessonType || (lesson.videoUrl ? "video" : "text");
    if (lessonType !== "video") return;
    
    const videoId = getYouTubeVideoId(lesson.videoUrl);
    if (!videoId) return;

    let playerInstance: any = null;

    const initializePlayer = () => {
      if (!videoId) return;

      // Destroy existing player if any
      if (playerInstance) {
        try {
          playerInstance.destroy();
        } catch (e) {
          // Ignore errors
        }
      }

      try {
        const player = new (window as any).YT.Player("youtube-player", {
          videoId: videoId,
          playerVars: {
            rel: 0, // Don't show related videos
            modestbranding: 1, // Remove YouTube logo
            controls: 1, // Show controls
            disablekb: 1, // Disable keyboard controls
            fs: 0, // Disable fullscreen
            iv_load_policy: 3, // Hide annotations
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              // Add watermark
              const iframe = event.target.getIframe();
              if (iframe && iframe.parentNode) {
                // Remove existing watermark if any
                const existingWatermark = iframe.parentNode.querySelector(".youtube-watermark");
                if (existingWatermark) {
                  existingWatermark.remove();
                }

                const watermark = document.createElement("div");
                watermark.className = "youtube-watermark";
                watermark.innerText = "محتوى حصري - ممنوع المشاركة";
                watermark.style.cssText =
                  "position:absolute;top:10px;right:10px;color:white;background:rgba(0,0,0,0.7);padding:8px 12px;border-radius:8px;font-size:14px;z-index:10;pointer-events:none;font-weight:bold;";
                iframe.parentNode.appendChild(watermark);
              }
            },
          },
        });
        playerInstance = player;
        setYoutubePlayer(player);
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    };

    // Check if YouTube API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializePlayer();
      }, 100);
    } else {
      // Load YouTube Iframe API
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      // Set callback when API is ready
      (window as any).onYouTubeIframeAPIReady = () => {
        setTimeout(() => {
          initializePlayer();
        }, 100);
      };
    }

    return () => {
      // Cleanup
      if (playerInstance) {
        try {
          playerInstance.destroy();
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, [lesson?.videoUrl]);

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

      // Use populated chapters from course data if available, otherwise fetch separately
      let chaptersData: Chapter[] = [];
      let chaptersWithLessonsData: Array<{ chapter: Chapter; lessons: Lesson[] }> = [];

      if (courseData.chapters && courseData.chapters.length > 0) {
        // Use populated chapters from backend
        chaptersData = courseData.chapters.map((ch: any) => ({
          _id: ch._id,
          title: ch.title,
          position: ch.position || 0,
          courseId: ch.courseId || courseId,
        }));
        chaptersWithLessonsData = courseData.chapters.map((ch: any) => ({
          chapter: {
            _id: ch._id,
            title: ch.title,
            position: ch.position || 0,
            courseId: ch.courseId || courseId,
          },
          lessons: (ch.lessons || []).sort((a: Lesson, b: Lesson) => (a.position || 0) - (b.position || 0)),
        }));
      } else {
        // Fallback: fetch chapters separately (for enrolled users, get all chapters, not just published)
        const chaptersRes = await axios.get(`${API_URL}/api/chapters/${courseId}`);
        chaptersData = (chaptersRes.data || []).sort((a: Chapter, b: Chapter) => (a.position || 0) - (b.position || 0));

        chaptersWithLessonsData = await Promise.all(
          chaptersData.map(async (ch: Chapter) => {
            try {
              const lessonsRes = await axios.get(`${API_URL}/api/lessons/chapter/${ch._id}`);
              const sortedLessons = (lessonsRes.data || []).sort((a: Lesson, b: Lesson) => (a.position || 0) - (b.position || 0));
              return {
                chapter: ch,
                lessons: sortedLessons,
              };
            } catch {
              return { chapter: ch, lessons: [] };
            }
          })
        );
      }

      setAllChapters(chaptersData);

      // Flatten to get all lessons with their chapter info
      const lessonsList: Array<{ lesson: Lesson; chapter: Chapter }> = [];
      chaptersWithLessonsData.forEach(({ chapter: ch, lessons }) => {
        lessons.forEach((l: Lesson) => {
          lessonsList.push({ lesson: l, chapter: ch });
        });
      });

      setAllLessons(lessonsList.map((item) => item.lesson));
      setChaptersWithLessons(chaptersWithLessonsData);

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

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    // Try extracting from ?v= parameter
    const vParamMatch = url.split("v=")[1]?.split("&")[0];
    if (vParamMatch && vParamMatch.length === 11) return vParamMatch;
    // Try extracting from URL path
    const pathMatch = url.split("/").pop();
    if (pathMatch && pathMatch.length === 11) return pathMatch;
    // Fallback to regex
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2] && match[2].length === 11 ? match[2] : null;
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
      <div className="min-h-screen bg-darker-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-old" />
      </div>
    );
  }

  if (!lesson || !chapter || !course || !isEnrolled) {
    return (
      <div className="min-h-screen bg-darker-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">الوصول مرفوض</h1>
          <p className="text-text-secondary mb-4">يجب أن تكون مسجلاً لعرض هذا الدرس.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="px-6 py-3 rounded-[50px] bg-gray-700 hover:bg-gray-600 text-white font-semibold inline-flex items-center gap-2 transition-colors">
              <i className="fas fa-home" />
              الرئيسية
            </Link>
            <button onClick={() => router.push(`/courses/${courseId}`)} className="px-6 py-3 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold inline-flex items-center gap-2 transition-colors">
              <i className="fas fa-arrow-right" />
              العودة للدورة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Declare YouTube API types
  declare global {
    interface Window {
      YT: any;
      onYouTubeIframeAPIReady: () => void;
    }
  }

  // Extract videoId from lesson (after conditional checks, before JSX)
  const videoUrl = lesson?.videoUrl || "";
  const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
  const lessonType = lesson?.lessonType || (videoUrl ? "video" : "text");
  const isVideoLesson = lessonType === "video";
  const isTextLesson = lessonType === "text";

  return (
    <div className="min-h-screen bg-darker-bg text-text-primary">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#1a1a1a]">
        <div className="container mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 rounded-[50px] bg-gray-700 hover:bg-gray-600 text-white font-semibold inline-flex items-center gap-2 text-sm transition-colors"
              >
                <i className="fas fa-home" />
                الرئيسية
              </Link>
              <button
                onClick={() => router.push(`/courses/${courseId}`)}
                className="px-4 py-2 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold inline-flex items-center gap-2 text-sm transition-colors"
              >
                <i className="fas fa-arrow-right" />
                العودة للدورة
              </button>
              <div className="h-6 w-px bg-gray-800" />
              <div>
                <h1 className="text-lg font-semibold text-white">{course.title}</h1>
                <p className="text-sm text-text-secondary">
                  {chapter.title} • الدرس {currentLessonIndex + 1} من {allLessons.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-5 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="p-6 bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{lesson.title}</h2>
                {lesson.duration && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <i className="fas fa-clock text-secondary-old" />
                    <span>{lesson.duration}</span>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {/* Video - Only show for video lessons */}
                {isVideoLesson && (
                  <>
                    {!videoId ? (
                      <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                        <p className="text-text-secondary">لا يوجد فيديو لهذا الدرس</p>
                      </div>
                    ) : (
                      <div
                        className="relative aspect-video w-full rounded-lg overflow-hidden bg-black select-none"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                        onDragStart={(e) => e.preventDefault()}
                        onSelectStart={(e) => e.preventDefault()}
                        style={{ userSelect: "none", WebkitUserSelect: "none" }}
                      >
                        <div id="youtube-player" className="w-full h-full" />
                      </div>
                    )}
                  </>
                )}

                {/* Text Content - Only show for text lessons */}
                {isTextLesson && lesson.content && (
                  <div
                    className="prose prose-lg prose-slate max-w-none dark:prose-invert text-white"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                )}

                {/* Description */}
                {lesson.description && (
                  <div>
                    <h3 className="font-semibold mb-2 text-white">الوصف</h3>
                    <p className="text-text-secondary whitespace-pre-wrap">{lesson.description}</p>
                  </div>
                )}

                {/* Attachments */}
                {lesson.attachments && lesson.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
                      <i className="fas fa-file-alt text-secondary-old" />
                      المرفقات
                    </h3>
                    <div className="space-y-2">
                      {lesson.attachments.map((attachment, idx) => (
                        <a
                          key={idx}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border border-glass-border rounded-lg hover:bg-gray-800 transition-colors bg-glass-bg"
                        >
                          <i className="fas fa-download text-secondary-old" />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-white">{attachment.name || `مرفق ${idx + 1}`}</p>
                            <p className="text-xs text-text-secondary">{attachment.type || "ملف"}</p>
                          </div>
                          <button className="px-4 py-2 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors">
                            <i className="fas fa-download ml-1" /> تحميل
                          </button>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => navigateToLesson(currentLessonIndex - 1)}
                disabled={currentLessonIndex === 0}
                className="px-6 py-3 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold inline-flex items-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600"
              >
                <i className="fas fa-arrow-right" />
                الدرس السابق
              </button>
              <button
                onClick={() => navigateToLesson(currentLessonIndex + 1)}
                disabled={currentLessonIndex >= allLessons.length - 1}
                className="px-6 py-3 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold inline-flex items-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600"
              >
                الدرس التالي
                <i className="fas fa-arrow-left" />
              </button>
            </div>
          </div>

          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 p-6 bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl">
              <h3 className="text-base font-bold text-white mb-4">محتوى الدورة</h3>
              <div className="max-h-[600px] overflow-y-auto">
                {chaptersWithLessons.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-4">
                    لا توجد فصول متاحة
                  </p>
                ) : (
                  <Accordion type="multiple" className="w-full" defaultValue={[chapterId]}>
                    {chaptersWithLessons.map(({ chapter: ch, lessons }) => (
                    <AccordionItem key={ch._id} value={ch._id} className="border-gray-800">
                      <AccordionTrigger className="hover:no-underline text-left text-white">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-sm">{ch.title}</span>
                          <span className="text-xs text-text-secondary">
                            {lessons.length} {lessons.length === 1 ? "درس" : "دروس"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 pt-2">
                          {lessons.map((l) => {
                            const isActive = l._id === lessonId;
                            return (
                              <Link
                                key={l._id}
                                href={`/courses/${courseId}/chapters/${ch._id}/lessons/${l._id}`}
                                className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                                  isActive
                                    ? "bg-cyan-600 text-white font-medium"
                                    : "hover:bg-gray-800 text-text-secondary"
                                }`}
                              >
                                <i className="fas fa-play text-xs flex-shrink-0" />
                                <span className="truncate flex-1">{l.title}</span>
                                {!l.isFree && (
                                  <i className="fas fa-lock text-xs flex-shrink-0 text-text-secondary" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;


