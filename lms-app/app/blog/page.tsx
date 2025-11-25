"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Post {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  author?: {
    username: string;
    email: string;
  };
}

const BlogPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts`);
      // Only show published posts on public blog page
      const publishedPosts = (response.data || []).filter((post: Post) => post.isPublished);
      setPosts(publishedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").substring(0, 150) + "...";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-muted-foreground text-lg">
              Latest articles and updates
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const postId = post._id || post.id || "";
                const postSlug = post.slug || postId;
                return (
                  <Link key={postId} href={`/blog/${postSlug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      {post.featuredImage && (
                        <div className="relative w-full h-48 bg-muted">
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt ? (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>
                        ) : post.content ? (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {stripHtml(post.content)}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;

