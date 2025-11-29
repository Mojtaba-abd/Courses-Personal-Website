"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2, Plus, ChevronDown, ChevronUp, Edit2, Trash2, GripVertical, Users, X, File, Upload, ImageIcon, Save } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface Chapter {
  _id: string;
  title: string;
  courseId: string;
  userId: string;
  position: number;
}

interface LessonAttachment {
  name: string;
  url: string;
  type: "pdf" | "zip" | "other";
  size?: number;
}

interface Lesson {
  _id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl: string;
  duration: string;
  isFree: boolean;
  chapterId: string;
  courseId: string;
  position: number;
  lessonType?: "video" | "text";
  attachments?: LessonAttachment[];
}

const CourseIdPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessonsByChapter, setLessonsByChapter] = useState<Record<string, Lesson[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [youtubeThumbnail, setYoutubeThumbnail] = useState<string>("");
  const [enrolledUsers, setEnrolledUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [lessonAttachments, setLessonAttachments] = useState<LessonAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [lessonType, setLessonType] = useState<"video" | "text">("text");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseCategory, setCourseCategory] = useState<string>("");
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const [courseFeaturedImage, setCourseFeaturedImage] = useState<string>("");
  const [courseImagePreview, setCourseImagePreview] = useState<string>("");
  const [isUploadingCourseImage, setIsUploadingCourseImage] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  const courseId = params.courseId as string;
  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  // YouTube thumbnail extractor
  const getYouTubeThumbnail = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
  };

  const fetchCourseData = async () => {
    try {
      const [courseRes, chaptersRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses/${courseId}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/chapters/${courseId}`, { withCredentials: true }),
      ]);

      setCourse(courseRes.data);
      setEnrolledUsers(courseRes.data.enrolledUsers || []);
      setCourseTitle(courseRes.data.title || "");
      setCourseCategory(courseRes.data.category || "");
      setCoursePrice(courseRes.data.price || 0);
      setCourseFeaturedImage(courseRes.data.featuredImage || "");
      setCourseImagePreview(courseRes.data.featuredImage || "");
      setIsPublished(courseRes.data.isPublished || false);
      const chaptersData = chaptersRes.data.sort((a: Chapter, b: Chapter) => a.position - b.position);
      setChapters(chaptersData);

      // Fetch lessons for each chapter
      const lessonsPromises = chaptersData.map((chapter: Chapter) =>
        axios.get(`${API_URL}/api/lessons/chapter/${chapter._id}`, { withCredentials: true })
      );
      const lessonsResponses = await Promise.all(lessonsPromises);
      const lessonsMap: Record<string, Lesson[]> = {};
      chaptersData.forEach((chapter: Chapter, index: number) => {
        lessonsMap[chapter._id] = lessonsResponses[index].data.sort(
          (a: Lesson, b: Lesson) => a.position - b.position
        );
      });
      setLessonsByChapter(lessonsMap);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("Failed to load course data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (searchQuery: string = "") => {
    try {
      const url = searchQuery
        ? `${API_URL}/api/users/search?q=${encodeURIComponent(searchQuery)}`
        : `${API_URL}/api/users`;
      const response = await axios.get(url, { withCredentials: true });
      const users = response.data.users || [];
      // Normalize user IDs - handle both _id and id
      const normalizedUsers = users.map((u: any) => ({
        ...u,
        id: u.id || u._id || u.id,
      }));
      setAllUsers(normalizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && courseId) {
      fetchCourseData();
      // Fetch users for enrollment section (teachers and admins can manage enrollment)
      if (user.role === "admin" || user.role === "teacher") {
        fetchUsers();
      }
    }
  }, [user, courseId, authLoading, router]);

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const openAddChapterDialog = () => {
    setEditingChapter(null);
    setChapterDialogOpen(true);
  };

  const openEditChapterDialog = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterDialogOpen(true);
  };

  const openAddLessonDialog = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setEditingLesson(null);
    setYoutubeThumbnail("");
    setLessonContent("");
    setLessonAttachments([]);
    setLessonType("text");
    setLessonDialogOpen(true);
  };

  const openEditLessonDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedChapterId(lesson.chapterId);
    // Determine lesson type: if videoUrl exists, it's a video lesson, otherwise text
    const type = lesson.lessonType || (lesson.videoUrl ? "video" : "text");
    setLessonType(type);
    setYoutubeThumbnail(getYouTubeThumbnail(lesson.videoUrl));
    setLessonContent(lesson.content || "");
    setLessonAttachments(lesson.attachments || []);
    setLessonDialogOpen(true);
  };

  const handleChapterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;

    try {
      if (editingChapter) {
        // Update chapter
        await axios.patch(
          `${API_URL}/api/chapters/${editingChapter._id}/course/${courseId}`,
          { title, userId: user?.id },
          { withCredentials: true }
        );
        toast.success("Chapter updated successfully");
      } else {
        // Create chapter
        const position = chapters.length;
        await axios.post(
          `${API_URL}/api/chapters`,
          { title, courseId, userId: user?.id, position },
          { withCredentials: true }
        );
        toast.success("Chapter created successfully");
      }
      setChapterDialogOpen(false);
      fetchCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save chapter");
    }
  };

  const handleAttachmentUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = ["application/pdf", "application/zip", "application/x-zip-compressed"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a PDF or ZIP file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("image", file); // Backend uses 'image' field name

      const response = await axios.post(
        `${API_URL}/api/upload/image`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const fileUrl = response.data.url;
      const fileType = file.type.includes("pdf") ? "pdf" : file.type.includes("zip") ? "zip" : "other";
      
      const newAttachment: LessonAttachment = {
        name: file.name,
        url: fileUrl,
        type: fileType,
        size: file.size,
      };

      setLessonAttachments([...lessonAttachments, newAttachment]);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload file");
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setLessonAttachments(lessonAttachments.filter((_, i) => i !== index));
  };

  const handleLessonSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const videoUrl = formData.get("videoUrl") as string;
    const duration = formData.get("duration") as string;
    const isFree = formData.get("isFree") === "on";

    // Use rich text content for text lessons
    const content = lessonType === "text" ? lessonContent : "";
    const description = content.substring(0, 200).replace(/<[^>]*>/g, "") || title; // Plain text excerpt

    // Prepare lesson data based on type
    const lessonData: any = {
      title,
      description,
      lessonType,
      isFree,
      attachments: lessonAttachments,
    };

    if (lessonType === "video") {
      lessonData.videoUrl = videoUrl;
      lessonData.duration = duration;
      lessonData.content = ""; // Clear content for video lessons
    } else {
      lessonData.content = content;
      lessonData.videoUrl = ""; // Clear videoUrl for text lessons
      lessonData.duration = ""; // Clear duration for text lessons
    }

    try {
      if (editingLesson) {
        // Update lesson
        await axios.put(
          `${API_URL}/api/lessons/${editingLesson._id}/chapter/${selectedChapterId}`,
          lessonData,
          { withCredentials: true }
        );
        toast.success("Lesson updated successfully");
      } else {
        // Create lesson
        const position = lessonsByChapter[selectedChapterId]?.length || 0;
        await axios.post(
          `${API_URL}/api/lessons`,
          {
            ...lessonData,
            chapterId: selectedChapterId,
            courseId,
            position,
          },
          { withCredentials: true }
        );
        toast.success("Lesson created successfully");
      }
      setLessonDialogOpen(false);
      setLessonContent("");
      setLessonAttachments([]);
      setLessonType("text");
      fetchCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save lesson");
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter? All lessons will be deleted too.")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/chapters/${chapterId}/course/${courseId}`, {
        withCredentials: true,
      });
      toast.success("Chapter deleted successfully");
      fetchCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete chapter");
    }
  };

  const handleDeleteLesson = async (lessonId: string, chapterId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/lessons/${lessonId}/chapter/${chapterId}`, {
        withCredentials: true,
      });
      toast.success("Lesson deleted successfully");
      fetchCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete lesson");
    }
  };

  const openEnrollmentDialog = () => {
    setSelectedUsers([...enrolledUsers]);
    setUserSearchQuery("");
    fetchUsers();
    setEnrollmentDialogOpen(true);
  };

  const handleEnrollmentSubmit = async () => {
    try {
      // Use Next.js API route which forwards authentication properly
      await axios.patch(
        `/api/courses/${courseId}`,
        { enrolledUsers: selectedUsers },
        { withCredentials: true }
      );
      toast.success("Enrollment updated successfully");
      setEnrollmentDialogOpen(false);
      fetchCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update enrollment");
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (!userId) return;
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const removeEnrolledUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user from the course?")) {
      return;
    }
    try {
      const updatedUsers = enrolledUsers.filter((id) => id !== userId);
      await axios.patch(
        `/api/courses/${courseId}`,
        { enrolledUsers: updatedUsers },
        { withCredentials: true }
      );
      toast.success("User removed from course");
      fetchCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to remove user");
    }
  };

  const handleCourseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setIsUploadingCourseImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        `${API_URL}/api/upload/image`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedUrl = response.data.url;
      setCourseFeaturedImage(uploadedUrl);
      setCourseImagePreview(uploadedUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload image");
    } finally {
      setIsUploadingCourseImage(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!courseTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSavingCourse(true);
    try {
      await axios.patch(
        `${API_URL}/api/courses/${courseId}`,
        {
          title: courseTitle,
          category: courseCategory,
          price: coursePrice,
          featuredImage: courseFeaturedImage,
          isPublished: isPublished,
        },
        { withCredentials: true }
      );
      toast.success("Course updated successfully");
      fetchCourseData();
    } catch (error: any) {
      console.error("Update course error:", error);
      toast.error(error.response?.data?.error || "Failed to update course");
    } finally {
      setIsSavingCourse(false);
    }
  };

  const CATEGORIES = [
    "Cybersecurity",
    "Web Development",
    "Networking",
    "DevOps",
    "Cloud Computing",
    "Data Science",
    "Machine Learning",
    "Mobile Development",
    "Database",
    "Programming",
    "Other",
  ];

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  if (authLoading || isLoading || !user) {
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
    <div className="p-6 max-w-6xl mx-auto bg-[#1a1a1a] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-white">Edit Course</h1>
        <p className="text-gray-400">Manage your course information and structure</p>
      </div>

      {/* Course Information Section */}
      <Card className="mb-6 bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Course Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="course-title" className="text-white">Title *</Label>
            <Input
              id="course-title"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g., Next.js Full Course"
              required
              className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="course-category" className="text-white">Category</Label>
            <select
              id="course-category"
              value={courseCategory}
              onChange={(e) => setCourseCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2"
            >
              <option value="" className="bg-[#0f0f0f] text-white">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#0f0f0f] text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="course-price" className="text-white">Price (USD)</Label>
            <Input
              id="course-price"
              type="number"
              min="0"
              step="0.01"
              value={coursePrice}
              onChange={(e) => setCoursePrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-400">Enter 0 for free course</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="course-featured-image" className="text-white">Featured Image</Label>
            {courseImagePreview ? (
              <div className="relative w-full h-48 mb-2 border border-gray-800 rounded-lg overflow-hidden">
                <img
                  src={courseImagePreview}
                  alt="Featured image preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setCourseFeaturedImage("");
                    setCourseImagePreview("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-800 rounded-lg bg-[#0f0f0f] hover:bg-gray-900 transition-colors">
                <label
                  htmlFor="course-featured-image"
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                >
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">
                    {isUploadingCourseImage ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
                <input
                  id="course-featured-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCourseImageUpload}
                  disabled={isUploadingCourseImage}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-[#0f0f0f]">
            <div>
              <Label htmlFor="course-publish" className="text-base font-medium text-white">
                Publish Course
              </Label>
              <p className="text-sm text-gray-400">
                {isPublished
                  ? "Course is visible to students"
                  : "Course is in draft mode (not visible to students)"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isPublished ? (
                <Badge className="bg-green-600 text-white px-3 py-1">Published</Badge>
              ) : (
                <Badge variant="secondary" className="px-3 py-1 bg-gray-700 text-gray-300">Draft</Badge>
              )}
              <Checkbox
                id="course-publish"
                checked={isPublished}
                onCheckedChange={(checked) => setIsPublished(checked === true)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveCourse} disabled={isSavingCourse || !courseTitle.trim()} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {isSavingCourse ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Course Info
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chapters Accordion */}
      <div className="space-y-4">
        {chapters.map((chapter) => {
          const isExpanded = expandedChapters.has(chapter._id);
          const lessons = lessonsByChapter[chapter._id] || [];

          return (
            <Card key={chapter._id} className="overflow-hidden bg-[#1a1a1a] border-gray-800">
              <CardHeader
                className="cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => toggleChapter(chapter._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-gray-800">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <CardTitle className="text-lg text-white">{chapter.title || "Untitled Chapter"}</CardTitle>
                    <span className="text-sm text-gray-400">
                      ({lessons.length} {lessons.length === 1 ? "lesson" : "lessons"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditChapterDialog(chapter);
                      }}
                      className="text-white hover:bg-gray-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChapter(chapter._id);
                      }}
                      className="text-red-500 hover:bg-gray-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="flex items-center justify-between p-3 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors bg-[#0f0f0f]"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-sm text-gray-400 line-clamp-1">
                                {lesson.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                              {lesson.duration && <span>Duration: {lesson.duration} min</span>}
                              {lesson.isFree && (
                                <span className="text-green-500 font-medium">Free</span>
                              )}
                            </div>
                          </div>
                          {lesson.videoUrl && (
                            <img
                              src={getYouTubeThumbnail(lesson.videoUrl)}
                              alt="Video thumbnail"
                              className="w-24 h-16 object-cover rounded border border-gray-800"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditLessonDialog(lesson)}
                            className="text-white hover:bg-gray-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLesson(lesson._id, lesson.chapterId)}
                            className="text-red-500 hover:bg-gray-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full border-gray-800 text-white hover:bg-gray-800 bg-[#0f0f0f]"
                      onClick={() => openAddLessonDialog(chapter._id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lesson
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        <Button variant="outline" className="w-full border-gray-800 text-white hover:bg-gray-800 bg-[#0f0f0f]" onClick={openAddChapterDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      </div>

      {/* Students Enrollment Section */}
      <Card className="mt-8 bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-white" />
              <CardTitle className="text-white">Enrolled Students</CardTitle>
            </div>
            <Button onClick={openEnrollmentDialog} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Manage Enrollment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrolledUsers.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No students enrolled yet. Click "Manage Enrollment" to add students.
            </p>
          ) : (
            <div className="space-y-2">
              {enrolledUsers.map((userId) => {
                const user = allUsers.find((u) => (u.id || u._id) === userId);
                if (!user && allUsers.length === 0) {
                  // Fetch user details if not loaded
                  fetchUsers();
                }
                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-3 border border-gray-800 rounded-lg bg-[#0f0f0f]"
                  >
                    <div>
                      <p className="font-medium text-white">{user?.username || `User ${userId.slice(0, 8)}`}</p>
                      {user?.email && (
                        <p className="text-sm text-gray-400">{user.email}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEnrolledUser(userId)}
                      className="text-red-500 hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <form onSubmit={handleChapterSubmit}>
            <DialogHeader>
              <DialogTitle className="text-white">{editingChapter ? "Edit Chapter" : "Add Chapter"}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingChapter
                  ? "Update the chapter title"
                  : "Enter a title for your new chapter"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="chapter-title" className="text-white">Title</Label>
                <Input
                  id="chapter-title"
                  name="title"
                  placeholder="e.g., Introduction to React"
                  defaultValue={editingChapter?.title || ""}
                  required
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChapterDialogOpen(false)} className="bg-[#1a1a1a] border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-800 text-white">
          <form onSubmit={handleLessonSubmit}>
            <DialogHeader>
              <DialogTitle className="text-white">{editingLesson ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingLesson
                  ? "Update the lesson details"
                  : "Fill in the details for your new lesson"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lesson-title" className="text-white">Title</Label>
                <Input
                  id="lesson-title"
                  name="title"
                  placeholder="e.g., Getting Started"
                  defaultValue={editingLesson?.title || ""}
                  required
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lesson-type" className="text-white">Lesson Type</Label>
                <Select
                  value={lessonType}
                  onValueChange={(value: "video" | "text") => {
                    setLessonType(value);
                    if (value === "video") {
                      setLessonContent("");
                    } else {
                      setYoutubeThumbnail("");
                    }
                  }}
                >
                  <SelectTrigger id="lesson-type" className="bg-[#0f0f0f] border-gray-800 text-white [&>span]:text-white">
                    <SelectValue placeholder="Select lesson type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="text" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">Text Lesson</SelectItem>
                    <SelectItem value="video" className="text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white">Video Lesson</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Choose whether this lesson contains text content or a video.
                </p>
              </div>

              {lessonType === "text" ? (
                <div className="grid gap-2">
                  <Label htmlFor="lesson-content" className="text-white">Content (Rich Text)</Label>
                  <RichTextEditor
                    value={lessonContent}
                    onChange={setLessonContent}
                  />
                  <p className="text-xs text-gray-400">
                    Use the editor to add formatted text, images, and links. Images will be uploaded automatically.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="lesson-videoUrl" className="text-white">YouTube URL</Label>
                    <Input
                      id="lesson-videoUrl"
                      name="videoUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      defaultValue={editingLesson?.videoUrl || ""}
                      required={lessonType === "video"}
                      onChange={(e) => {
                        setYoutubeThumbnail(getYouTubeThumbnail(e.target.value));
                      }}
                      className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                    />
                    {youtubeThumbnail && (
                      <div className="mt-2">
                        <img
                          src={youtubeThumbnail}
                          alt="Video thumbnail"
                          className="w-full h-48 object-cover rounded border border-gray-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lesson-duration" className="text-white">Duration (minutes)</Label>
                    <Input
                      id="lesson-duration"
                      name="duration"
                      type="number"
                      placeholder="e.g., 15"
                      defaultValue={editingLesson?.duration || ""}
                      min="0"
                      className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lesson-isFree"
                  name="isFree"
                  defaultChecked={editingLesson?.isFree || false}
                />
                <Label htmlFor="lesson-isFree" className="cursor-pointer text-white">
                  Free lesson (accessible without purchase)
                </Label>
              </div>

              {/* Attachments Section */}
              <div className="grid gap-2 border-t border-gray-800 pt-4">
                <Label className="text-white">Attachments (PDF/ZIP)</Label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="attachment-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-800 rounded-md cursor-pointer hover:bg-gray-800 transition-colors text-white bg-[#0f0f0f]"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">
                      {isUploadingAttachment ? "Uploading..." : "Upload File"}
                    </span>
                  </label>
                  <input
                    id="attachment-upload"
                    type="file"
                    accept=".pdf,.zip"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAttachmentUpload(file);
                    }}
                    disabled={isUploadingAttachment}
                  />
                </div>
                {lessonAttachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {lessonAttachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-800 rounded-lg bg-[#0f0f0f]"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <File className="h-4 w-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">{attachment.name}</p>
                            <p className="text-xs text-gray-400">
                              {attachment.type.toUpperCase()} •{" "}
                              {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-gray-400 hover:text-red-500 hover:bg-gray-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Upload PDF or ZIP files (max 50MB each). Students can download these files.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setLessonDialogOpen(false);
                setLessonContent("");
                setLessonAttachments([]);
                setLessonType("text");
              }} className="bg-[#1a1a1a] border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Course Enrollment</DialogTitle>
            <DialogDescription className="text-gray-400">
              Search and select users to enroll in this course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-search" className="text-white">Search Users</Label>
              <Input
                id="user-search"
                placeholder="Search by name or email..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  fetchUsers(e.target.value);
                }}
                className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="border border-gray-800 rounded-lg max-h-96 overflow-y-auto bg-[#0f0f0f]">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No users found
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {filteredUsers.map((u) => {
                    const userId = u.id || u._id || "";
                    const isSelected = selectedUsers.includes(userId);
                    return (
                      <div
                        key={userId}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-800"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers((prev) => {
                                if (!prev.includes(userId)) {
                                  return [...prev, userId];
                                }
                                return prev;
                              });
                            } else {
                              setSelectedUsers((prev) => prev.filter((id) => id !== userId));
                            }
                          }}
                        />
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setSelectedUsers((prev) => {
                              if (prev.includes(userId)) {
                                return prev.filter((id) => id !== userId);
                              } else {
                                return [...prev, userId];
                              }
                            });
                          }}
                        >
                          <p className="font-medium text-white">{u.username}</p>
                          <p className="text-sm text-gray-400">{u.email}</p>
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{u.role}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} selected
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnrollmentDialogOpen(false)} className="bg-[#1a1a1a] border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleEnrollmentSubmit} className="bg-cyan-600 hover:bg-cyan-700 text-white">Save Enrollment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseIdPage;
