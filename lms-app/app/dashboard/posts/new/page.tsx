"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/rich-text-editor";
import { toast } from "react-hot-toast";
import Link from "next/link";

const NewPostPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">New Post</h1>
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
                {isPublished ? "Publish" : "Save Draft"}
              </>
            )}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4">{title || "Untitled"}</h1>
            {excerpt && (
              <p className="text-xl text-muted-foreground mb-4">{excerpt}</p>
            )}
          </div>
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

export default NewPostPage;

