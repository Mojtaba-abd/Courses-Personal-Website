"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2, Save, Eye, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/rich-text-editor";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Link from "next/link";

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

const NewPostPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [category, setCategory] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/posts`,
        {
          title,
          slug: generateSlug(title),
          content,
          excerpt,
          featuredImage,
          category,
          isPublished,
        },
        { withCredentials: true }
      );

      toast.success(isPublished ? "Post published successfully!" : "Post saved as draft");
      router.push(`/dashboard/posts/${response.data._id || response.data.id}`);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.error || "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-[#0f0f0f] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">New Post</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
          <Link href="/dashboard/posts">
            <Button variant="outline" className="border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isPublished ? "Publish" : "Save Draft"}
              </>
            )}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-6 bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6">
          <div>
            {category && (
              <span className="inline-flex items-center rounded-full bg-cyan-600/20 px-3 py-1 text-sm font-medium text-cyan-500 mb-4">
                {category}
              </span>
            )}
            <h1 className="text-4xl font-bold mb-4 text-white">{title || "Untitled"}</h1>
            {excerpt && (
              <p className="text-xl text-gray-400 mb-4">{excerpt}</p>
            )}
          </div>
          {imagePreview && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="Featured image"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}
          <div
            className="prose prose-lg max-w-none text-white"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      ) : (
        <div className="space-y-6 bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-white">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="text-lg bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
            />
            {title && (
              <p className="text-xs text-gray-400">
                Slug: {generateSlug(title)}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="excerpt" className="text-white">Excerpt (optional)</Label>
            <Input
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the post..."
              className="bg-[#0f0f0f] border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="featured-image" className="text-white">Featured Image (optional)</Label>
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category" className="text-white">Category (optional)</Label>
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
            <Label className="text-white">Content *</Label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked as boolean)}
            />
            <Label htmlFor="published" className="cursor-pointer text-white">
              Publish immediately
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPostPage;

