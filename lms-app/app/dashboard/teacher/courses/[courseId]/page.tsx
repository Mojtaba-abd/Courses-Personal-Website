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
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseCategory, setCourseCategory] = useState<string>("");
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
      // Fetch users for enrollment section
      if (user.role === "admin") {
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
    setLessonDialogOpen(true);
  };

  const openEditLessonDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedChapterId(lesson.chapterId);
    setYoutubeThumbnail(getYouTubeThumbnail(lesson.videoUrl));
    setLessonContent(lesson.content || lesson.description || "");
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

    // Use rich text content, fallback to description if empty
    const content = lessonContent || "";
    const description = content.substring(0, 200).replace(/<[^>]*>/g, ""); // Plain text excerpt

    try {
      if (editingLesson) {
        // Update lesson
        await axios.put(
          `${API_URL}/api/lessons/${editingLesson._id}/chapter/${selectedChapterId}`,
          { 
            title, 
            description, 
            content, 
            videoUrl, 
            duration, 
            isFree,
            attachments: lessonAttachments,
          },
          { withCredentials: true }
        );
        toast.success("Lesson updated successfully");
      } else {
        // Create lesson
        const position = lessonsByChapter[selectedChapterId]?.length || 0;
        await axios.post(
          `${API_URL}/api/lessons`,
          { 
            title, 
            description, 
            content, 
            videoUrl, 
            duration, 
            isFree, 
            chapterId: selectedChapterId, 
            courseId, 
            position,
            attachments: lessonAttachments,
          },
          { withCredentials: true }
        );
        toast.success("Lesson created successfully");
      }
      setLessonDialogOpen(false);
      setLessonContent("");
      setLessonAttachments([]);
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
      // Use PATCH for course update (works for authenticated users)
      await axios.patch(
        `${API_URL}/api/courses/${courseId}`,
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
        `${API_URL}/api/courses/${courseId}`,
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Edit Course</h1>
        <p className="text-muted-foreground">Manage your course information and structure</p>
      </div>

      {/* Course Information Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="course-title">Title *</Label>
            <Input
              id="course-title"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g., Next.js Full Course"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="course-category">Category</Label>
            <select
              id="course-category"
              value={courseCategory}
              onChange={(e) => setCourseCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="course-featured-image">Featured Image</Label>
            {courseImagePreview ? (
              <div className="relative w-full h-48 mb-2 border rounded-lg overflow-hidden">
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
              <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <label
                  htmlFor="course-featured-image"
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isUploadingCourseImage ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="course-publish" className="text-base font-medium">
                Publish Course
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublished
                  ? "Course is visible to students"
                  : "Course is in draft mode (not visible to students)"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isPublished ? (
                <Badge className="bg-green-600 text-white px-3 py-1">Published</Badge>
              ) : (
                <Badge variant="secondary" className="px-3 py-1">Draft</Badge>
              )}
              <Checkbox
                id="course-publish"
                checked={isPublished}
                onCheckedChange={(checked) => setIsPublished(checked === true)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveCourse} disabled={isSavingCourse || !courseTitle.trim()}>
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
            <Card key={chapter._id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleChapter(chapter._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <CardTitle className="text-lg">{chapter.title || "Untitled Chapter"}</CardTitle>
                    <span className="text-sm text-muted-foreground">
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
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {lesson.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              {lesson.duration && <span>Duration: {lesson.duration} min</span>}
                              {lesson.isFree && (
                                <span className="text-green-600 font-medium">Free</span>
                              )}
                            </div>
                          </div>
                          {lesson.videoUrl && (
                            <img
                              src={getYouTubeThumbnail(lesson.videoUrl)}
                              alt="Video thumbnail"
                              className="w-24 h-16 object-cover rounded"
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
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLesson(lesson._id, lesson.chapterId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full"
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

        <Button variant="outline" className="w-full" onClick={openAddChapterDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      </div>

      {/* Students Enrollment Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Enrolled Students</CardTitle>
            </div>
            <Button onClick={openEnrollmentDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Manage Enrollment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrolledUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
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
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user?.username || `User ${userId.slice(0, 8)}`}</p>
                      {user?.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEnrolledUser(userId)}
                    >
                      <X className="h-4 w-4 text-destructive" />
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
        <DialogContent>
          <form onSubmit={handleChapterSubmit}>
            <DialogHeader>
              <DialogTitle>{editingChapter ? "Edit Chapter" : "Add Chapter"}</DialogTitle>
              <DialogDescription>
                {editingChapter
                  ? "Update the chapter title"
                  : "Enter a title for your new chapter"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="chapter-title">Title</Label>
                <Input
                  id="chapter-title"
                  name="title"
                  placeholder="e.g., Introduction to React"
                  defaultValue={editingChapter?.title || ""}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChapterDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleLessonSubmit}>
            <DialogHeader>
              <DialogTitle>{editingLesson ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
              <DialogDescription>
                {editingLesson
                  ? "Update the lesson details"
                  : "Fill in the details for your new lesson"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lesson-title">Title</Label>
                <Input
                  id="lesson-title"
                  name="title"
                  placeholder="e.g., Getting Started"
                  defaultValue={editingLesson?.title || ""}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="lesson-content">Content (Rich Text)</Label>
                <RichTextEditor
                  value={lessonContent}
                  onChange={setLessonContent}
                />
                <p className="text-xs text-muted-foreground">
                  Use the editor to add formatted text, images, and links. Images will be uploaded automatically.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lesson-videoUrl">YouTube URL</Label>
                <Input
                  id="lesson-videoUrl"
                  name="videoUrl"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  defaultValue={editingLesson?.videoUrl || ""}
                  onChange={(e) => {
                    setYoutubeThumbnail(getYouTubeThumbnail(e.target.value));
                  }}
                />
                {youtubeThumbnail && (
                  <div className="mt-2">
                    <img
                      src={youtubeThumbnail}
                      alt="Video thumbnail"
                      className="w-full h-48 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                <Input
                  id="lesson-duration"
                  name="duration"
                  type="number"
                  placeholder="e.g., 15"
                  defaultValue={editingLesson?.duration || ""}
                  min="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lesson-isFree"
                  name="isFree"
                  defaultChecked={editingLesson?.isFree || false}
                />
                <Label htmlFor="lesson-isFree" className="cursor-pointer">
                  Free lesson (accessible without purchase)
                </Label>
              </div>

              {/* Attachments Section */}
              <div className="grid gap-2 border-t pt-4">
                <Label>Attachments (PDF/ZIP)</Label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="attachment-upload"
                    className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors"
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
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <File className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
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
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload PDF or ZIP files (max 50MB each). Students can download these files.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setLessonDialogOpen(false);
                setLessonContent("");
                setLessonAttachments([]);
              }}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Course Enrollment</DialogTitle>
            <DialogDescription>
              Search and select users to enroll in this course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-search">Search Users</Label>
              <Input
                id="user-search"
                placeholder="Search by name or email..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  fetchUsers(e.target.value);
                }}
              />
            </div>
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map((u) => {
                    const userId = u.id || u._id || "";
                    const isSelected = selectedUsers.includes(userId);
                    return (
                      <div
                        key={userId}
                        className="flex items-center space-x-3 p-3 hover:bg-muted/50"
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
                          <p className="font-medium">{u.username}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">{u.role}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} selected
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnrollmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnrollmentSubmit}>Save Enrollment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseIdPage;
