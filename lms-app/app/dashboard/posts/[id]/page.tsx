"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

const EditPostPage = () => {
  const router = useRouter();
  const params = useParams();
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
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  const postId = params.id as string;
  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    if (user?.role === "admin" && postId) {
      fetchPost();
    }
  }, [user, authLoading, router, postId]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts/${postId}`, {
        withCredentials: true,
      });

      if (response.data) {
        setTitle(response.data.title || "");
        setContent(response.data.content || "");
        setExcerpt(response.data.excerpt || "");
        setFeaturedImage(response.data.featuredImage || "");
        setCategory(response.data.category || "");
        setImagePreview(response.data.featuredImage || "");
        setIsPublished(response.data.isPublished || false);
      } else {
        toast.error("Post not found");
        router.push("/dashboard/posts");
      }
    } catch (error: any) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post");
      router.push("/dashboard/posts");
    } finally {
      setIsLoading(false);
    }
  };

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
      await axios.put(
        `${API_URL}/api/posts/${postId}`,
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

      toast.success(isPublished ? "Post updated and published!" : "Post saved");
      fetchPost();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.error || "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading || !user || user.role !== "admin") {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
          <Link href="/dashboard/posts">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isPublished ? "Update & Publish" : "Save Draft"}
              </>
            )}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-6">
          <div>
            {category && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                {category}
              </span>
            )}
            <h1 className="text-4xl font-bold mb-4">{title || "Untitled"}</h1>
            {excerpt && (
              <p className="text-xl text-muted-foreground mb-4">{excerpt}</p>
            )}
          </div>
          {imagePreview && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="Featured image"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="text-lg"
            />
            {title && (
              <p className="text-xs text-muted-foreground">
                Slug: {generateSlug(title)}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="excerpt">Excerpt (optional)</Label>
            <Input
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the post..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="featured-image">Featured Image (optional)</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 mb-2 border rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Featured image preview"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <label
                  htmlFor="featured-image"
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
            <Label htmlFor="category">Category (optional)</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
            <Label>Content *</Label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked as boolean)}
            />
            <Label htmlFor="published" className="cursor-pointer">
              Publish immediately
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPostPage;

