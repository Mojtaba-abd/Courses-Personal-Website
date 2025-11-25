"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Post {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  publishedAt?: string;
}

const PostsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

    if (user?.role === "admin") {
      fetchPosts();
    }
  }, [user, authLoading, router]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts`, {
        withCredentials: true,
      });
      setPosts(response.data || []);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast.error(error.response?.data?.error || "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (post: Post) => {
    setDeletingPost(post);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingPost) return;

    setIsDeleting(true);
    try {
      const postId = deletingPost._id || deletingPost.id || "";
      await axios.delete(`${API_URL}/api/posts/${postId}`, {
        withCredentials: true,
      });
      toast.success("Post deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingPost(null);
      fetchPosts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog posts</p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No posts found. Click "New Post" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => {
                  const postId = post._id || post.id || "";
                  return (
                    <TableRow key={postId}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        <Badge
                          className={post.isPublished ? "bg-green-600" : "bg-gray-500"}
                        >
                          {post.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(post.publishedAt || post.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/posts/${postId}`}>
                            <Button variant="ghost" size="icon">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(post)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              "{deletingPost?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostsPage;

