"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2, Plus, ChevronDown, ChevronUp, Edit2, Trash2, GripVertical, ImageIcon, X, Save, Users, File, Upload } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Link from "next/link";

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

interface User {
  id?: string;
  _id?: string;
  username: string;
  email: string;
  role: string;
}

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

const CreateCoursePage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [featuredImage, setFeaturedImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessonsByChapter, setLessonsByChapter] = useState<Record<string, Lesson[]>>({});
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [youtubeThumbnail, setYoutubeThumbnail] = useState<string>("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [lessonAttachments, setLessonAttachments] = useState<LessonAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [lessonType, setLessonType] = useState<"video" | "text">("text");

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
    if (user && user.role !== "admin" && user.role !== "teacher") {
      router.push("/dashboard");
    }
    if (user && (user.role === "admin" || user.role === "teacher")) {
      fetchUsers();
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`, {
        withCredentials: true,
      });
      const normalizedUsers = (response.data.users || []).map((u: any) => ({
        ...u,
        id: u.id || u._id || u.id,
      }));
      setAllUsers(normalizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // YouTube thumbnail extractor
  const getYouTubeThumbnail = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
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
      setFeaturedImage(uploadedUrl);
      setImagePreview(uploadedUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFeaturedImage("");
    setImagePreview("");
  };

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

    if (editingChapter) {
      // Update existing chapter
      setChapters(chapters.map((ch) => 
        ch._id === editingChapter._id ? { ...ch, title } : ch
      ));
      toast.success("Chapter updated");
    } else {
      // Store chapter locally (will be saved when course is created)
      const newChapter: Chapter = {
        _id: `temp-${Date.now()}`,
        title,
        courseId: "",
        userId: user?.id || "",
        position: chapters.length,
      };
      setChapters([...chapters, newChapter]);
      toast.success("Chapter added (will be saved with course)");
    }
    setChapterDialogOpen(false);
    setEditingChapter(null);
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    setChapters(chapters.filter((ch) => ch._id !== chapterId));
    delete lessonsByChapter[chapterId];
    setLessonsByChapter({ ...lessonsByChapter });
    toast.success("Chapter removed");
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

    if (editingLesson) {
      // Update existing lesson
      setLessonsByChapter({
        ...lessonsByChapter,
        [selectedChapterId]: (lessonsByChapter[selectedChapterId] || []).map((l) =>
          l._id === editingLesson._id
            ? { ...l, ...lessonData }
            : l
        ),
      });
      toast.success("Lesson updated");
    } else {
      // Add new lesson
      const newLesson: Lesson = {
        _id: `temp-${Date.now()}`,
        ...lessonData,
        chapterId: selectedChapterId,
        courseId: "",
        position: (lessonsByChapter[selectedChapterId]?.length || 0),
      };

      setLessonsByChapter({
        ...lessonsByChapter,
        [selectedChapterId]: [...(lessonsByChapter[selectedChapterId] || []), newLesson],
      });
      toast.success("Lesson added (will be saved with course)");
    }
    setLessonDialogOpen(false);
    setEditingLesson(null);
    setSelectedChapterId("");
    setLessonContent("");
    setLessonAttachments([]);
    setLessonType("text");
  };

  const handleDeleteLesson = async (lessonId: string, chapterId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    setLessonsByChapter({
      ...lessonsByChapter,
      [chapterId]: (lessonsByChapter[chapterId] || []).filter((l) => l._id !== lessonId),
    });
    toast.success("Lesson removed");
  };

  const openEnrollmentDialog = () => {
    setEnrollmentDialogOpen(true);
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

  const handleCreateCourse = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      // Step 1: Create the course
      const courseResponse = await axios.post(
        `${API_URL}/api/courses`,
        { title, category, featuredImage, price, enrolledUsers: selectedUsers, isPublished },
        { withCredentials: true }
      );

      const newCourseId = courseResponse.data._id || courseResponse.data.id;
      toast.success("Course created successfully!");

      // Step 2: Create chapters
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        try {
          const chapterResponse = await axios.post(
            `${API_URL}/api/chapters/${newCourseId}`,
            { title: chapter.title },
            { withCredentials: true }
          );

          const chapterId = chapterResponse.data._id || chapterResponse.data.id;
          
          // Step 3: Create lessons for this chapter
          const lessons = lessonsByChapter[chapter._id] || [];
          for (const lesson of lessons) {
            try {
              await axios.post(
                `${API_URL}/api/lessons`,
                {
                  title: lesson.title,
                  description: lesson.description,
                  content: lesson.content || lesson.description,
                  videoUrl: lesson.videoUrl,
                  duration: lesson.duration,
                  isFree: lesson.isFree,
                  chapterId: chapterId,
                  courseId: newCourseId,
                  position: lesson.position,
                  attachments: lesson.attachments || [],
                },
                { withCredentials: true }
              );
            } catch (error) {
              console.error("Error creating lesson:", error);
            }
          }
        } catch (error) {
          console.error("Error creating chapter:", error);
        }
      }

      toast.success("Course with all chapters and lessons created successfully!");
      router.push(`/dashboard/teacher/courses/${newCourseId}`);
    } catch (error: any) {
      console.error("Create course error:", error);
      toast.error(error.response?.data?.error || "Failed to create course");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const enrolledUsersDetails = allUsers.filter((u) => {
    const userId = u.id || u._id || "";
    return selectedUsers.includes(userId);
  });

  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    return null;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-[#0f0f0f] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-white">Create New Course</h1>
        <p className="text-gray-400">Add course details, structure, and enrolled students</p>
      </div>

      {/* Course Information Section */}
      <div className="mb-6 bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">Course Information</h3>
          <p className="text-sm text-gray-400 mt-1">Basic details about your course</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-white">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Next.js Full Course"
              required
              className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category" className="text-white">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
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
            <Label htmlFor="featured-image" className="text-white">Featured Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 mb-2 border border-gray-800 rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Featured image preview"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-800 rounded-lg bg-[#0f0f0f] hover:bg-gray-900 transition-colors">
                <label
                  htmlFor="featured-image"
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                >
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">
                    {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
                <input
                  id="featured-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>
            )}
            <p className="text-xs text-gray-400">
              Featured image displayed on course cards and listings
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-[#0f0f0f]">
            <div>
              <Label htmlFor="course-publish" className="text-base font-medium text-white">
                Publish Course
              </Label>
              <p className="text-sm text-gray-400">
                {isPublished
                  ? "Course will be visible to students"
                  : "Course will be in draft mode (not visible to students)"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isPublished ? (
                <Badge className="bg-green-600 text-white px-3 py-1">Published</Badge>
              ) : (
                <Badge className="bg-gray-700 text-gray-300 px-3 py-1">Draft</Badge>
              )}
              <Checkbox
                id="course-publish"
                checked={isPublished}
                onCheckedChange={(checked) => setIsPublished(checked === true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Structure Section */}
      <div className="mb-6 bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Course Structure</h3>
              <p className="text-sm text-gray-400 mt-1">Add chapters and lessons to organize your course content</p>
            </div>
            <Button onClick={openAddChapterDialog} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Chapter
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {chapters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No chapters yet. Add your first chapter to get started.</p>
                <Button onClick={openAddChapterDialog} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chapter
                </Button>
              </div>
            ) : (
              chapters.map((chapter) => {
                const isExpanded = expandedChapters.has(chapter._id);
                const lessons = lessonsByChapter[chapter._id] || [];

                return (
                  <div key={chapter._id} className="overflow-hidden bg-[#0f0f0f] border border-gray-800 rounded-lg mb-4">
                    <div
                      className="cursor-pointer hover:bg-gray-800/50 transition-colors p-4 border-b border-gray-800"
                      onClick={() => toggleChapter(chapter._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-800">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <h3 className="text-lg font-semibold text-white">{chapter.title || "Untitled Chapter"}</h3>
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
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
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
                            className="text-gray-400 hover:text-red-500 hover:bg-gray-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-0 p-4">
                        <div className="space-y-3">
                          {lessons.map((lesson) => (
                            <div
                              key={lesson._id}
                              className="flex items-center justify-between p-3 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors bg-[#0f0f0f] mb-2"
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
                                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteLesson(lesson._id, lesson.chapterId)}
                                  className="text-gray-400 hover:text-red-500 hover:bg-gray-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                            onClick={() => openAddLessonDialog(chapter._id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lesson
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Enrolled Students Section */}
      <div className="mb-6 bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Enrolled Students</h3>
              <p className="text-sm text-gray-400 mt-1">Select users to enroll in this course</p>
            </div>
            <Button onClick={openEnrollmentDialog} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Users className="h-4 w-4 mr-2" />
              Manage Enrollment
            </Button>
          </div>
        </div>
        <div className="p-6">
          {enrolledUsersDetails.length === 0 ? (
            <p className="text-sm text-gray-400">No students enrolled yet. Click "Manage Enrollment" to add students.</p>
          ) : (
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-gray-800/50">
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledUsersDetails.map((student) => {
                    const userId = student.id || student._id || "";
                    return (
                      <TableRow key={userId} className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-white">{student.username}</TableCell>
                        <TableCell className="text-gray-300">{student.email}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-cyan-600/20 px-2.5 py-0.5 text-xs font-medium text-cyan-500 capitalize">
                            {student.role}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Create Course Button */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Link href="/dashboard/teacher/courses">
          <Button variant="outline" className="bg-[#1a1a1a] border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">Cancel</Button>
        </Link>
        <Button onClick={handleCreateCourse} disabled={!title.trim() || isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Course...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Course
            </>
          )}
        </Button>
      </div>

      {/* Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <form onSubmit={handleChapterSubmit}>
            <DialogHeader>
              <DialogTitle className="text-white">{editingChapter ? "Edit Chapter" : "Add Chapter"}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingChapter
                  ? "Update the chapter title"
                  : "Add a new chapter to organize your course content"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="chapter-title" className="text-white">Chapter Title *</Label>
                <Input
                  id="chapter-title"
                  name="title"
                  placeholder="e.g., Introduction to Next.js"
                  required
                  defaultValue={editingChapter?.title || ""}
                  className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChapterDialogOpen(false)} className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">
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
                  : "Add a new lesson to this chapter"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lesson-title" className="text-white">Lesson Title *</Label>
                <Input
                  id="lesson-title"
                  name="title"
                  placeholder="e.g., Setting up Next.js"
                  required
                  defaultValue={editingLesson?.title || ""}
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
                    <Label htmlFor="lesson-video" className="text-white">Video URL (YouTube)</Label>
                    <Input
                      id="lesson-video"
                      name="videoUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      defaultValue={editingLesson?.videoUrl || ""}
                      required={lessonType === "video"}
                      onChange={(e) => setYoutubeThumbnail(getYouTubeThumbnail(e.target.value))}
                      className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                    />
                    {youtubeThumbnail && (
                      <div className="relative w-full h-48 mt-2 rounded-lg overflow-hidden">
                        <img
                          src={youtubeThumbnail}
                          alt="YouTube thumbnail"
                          className="w-full h-full object-cover"
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
                      className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lesson-free"
                  name="isFree"
                  defaultChecked={editingLesson?.isFree || false}
                />
                <Label htmlFor="lesson-free" className="cursor-pointer text-white">
                  Free lesson (accessible without enrollment)
                </Label>
              </div>

              {/* Attachments Section */}
              <div className="grid gap-2 border-t border-gray-800 pt-4">
                <Label className="text-white">Attachments (PDF/ZIP)</Label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="attachment-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-800 rounded-md cursor-pointer hover:bg-gray-800 transition-colors text-white"
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
              }} className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">
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
                onChange={(e) => setUserSearchQuery(e.target.value)}
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
                        className="flex items-center space-x-3 p-3 hover:bg-gray-800/50"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleUserSelection(userId)}
                        />
                        <div className="flex-1">
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
            <Button type="button" variant="outline" onClick={() => setEnrollmentDialogOpen(false)} className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateCoursePage;

