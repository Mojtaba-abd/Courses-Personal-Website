"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { Loader2, Calendar, User } from "lucide-react";

interface Post {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  author?: {
    username: string;
    email: string;
  };
}

const BlogPostPage = () => {
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params.slug as string;
  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts/slug/${slug}`);
      setPost(response.data);
    } catch (error: any) {
      console.error("Error fetching post:", error);
      if (error.response?.status === 404) {
        setError("Post not found");
      } else {
        setError("Failed to load post");
      }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-muted-foreground">{error || "The post you're looking for doesn't exist."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darker-bg text-text-primary">
      <article className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-secondary-old transition-colors">
              <i className="fas fa-arrow-right" />
              <span>العودة للصفحة الرئيسية</span>
            </Link>
          </div>
          <header className="mb-8">
            {post.category && (
              <span className="inline-flex items-center rounded-full bg-cyan-600/20 px-3 py-1 text-sm font-medium text-cyan-500 mb-4">
                {post.category}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{post.title}</h1>
            {post.excerpt && (
              <p className="text-xl text-text-secondary mb-6">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {post.author && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{post.author.username}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>
            </div>
          </header>

          {post.featuredImage && (
            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-lg prose-slate max-w-none dark:prose-invert text-white"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </div>
  );
};

export default BlogPostPage;

