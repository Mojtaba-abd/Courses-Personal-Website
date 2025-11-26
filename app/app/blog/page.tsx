"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Post {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featuredImage?: string;
  category?: string;
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
    <div className="min-h-screen bg-darker-bg text-text-primary">
      <div className="container mx-auto px-5 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-secondary-old transition-colors">
              <i className="fas fa-arrow-right" />
              <span>العودة للصفحة الرئيسية</span>
            </Link>
          </div>
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-cyber bg-clip-text text-transparent">
              <i className="fas fa-blog ml-4 text-secondary-old" /> المدونة
            </h1>
            <p className="text-text-secondary text-lg">
              آخر المقالات والأخبار
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">لا توجد مقالات متاحة حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const postId = post._id || post.id || "";
                const postSlug = post.slug || postId;
                return (
                  <Link key={postId} href={`/blog/${postSlug}`}>
                    <div className="overflow-hidden transition-all hover:-translate-y-2.5 hover:shadow-glow bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl">
                      {post.featuredImage && (
                        <div className="w-full h-48 bg-gradient-cyber flex items-center justify-center text-5xl text-white/30 relative overflow-hidden">
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            sizes="100vw"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-darker-bg" />
                        </div>
                      )}
                      <div className="p-6">
                        {post.category && (
                          <span className="inline-block px-3 py-1 rounded-full bg-gradient-2 text-white text-xs mb-3">
                            {post.category}
                          </span>
                        )}
                        <h2 className="text-xl font-semibold mb-4 text-white line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt ? (
                          <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>
                        ) : post.content ? (
                          <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                            {stripHtml(post.content)}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-auto">
                          <i className="fas fa-calendar text-secondary-old" />
                          <span>
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
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

