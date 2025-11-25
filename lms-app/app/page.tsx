"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ExternalLink,
  Award,
  BookOpen,
  FileText,
  Send
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface Certificate {
  _id: string;
  title: string;
  issuer: string;
  issueDate: string;
  certificateUrl?: string;
  imageUrl: string;
}

interface Post {
  _id: string;
  title: string;
  excerpt: string;
  slug: string;
  category?: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
  category?: string;
  featuredImage?: string;
  description?: string;
}

const HomePage = () => {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certsRes, postsRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/api/certificates`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/posts`).catch(() => ({ data: [] })),
        // For public access, we need to get all courses and filter client-side
        // since backend requires auth for non-published courses
        axios.get(`${API_URL}/api/courses`).catch(() => ({ data: [] })),
      ]);

      // Filter published posts and courses
      const publishedPosts = (postsRes.data || []).filter((p: Post) => p.isPublished || p.published).slice(0, 3);
      const publishedCourses = (coursesRes.data || [])
        .filter((c: Course) => (c.isPublished || c.published))
        .slice(0, 3);

      setCertificates(certsRes.data || []);
      setPosts(publishedPosts);
      setCourses(publishedCourses);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/contact`, contactForm);
      toast.success("تم إرسال رسالتك بنجاح!");
      setContactForm({ name: "", email: "", message: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">Hussein Ali</div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection("home")} className="hover:text-primary transition-colors">
                Home
              </button>
              <button onClick={() => scrollToSection("about")} className="hover:text-primary transition-colors">
                About
              </button>
              <button onClick={() => scrollToSection("certifications")} className="hover:text-primary transition-colors">
                Certifications
              </button>
              <button onClick={() => scrollToSection("blog")} className="hover:text-primary transition-colors">
                Blog
              </button>
              <button onClick={() => scrollToSection("courses")} className="hover:text-primary transition-colors">
                Courses
              </button>
              <button onClick={() => scrollToSection("contact")} className="hover:text-primary transition-colors">
                Contact
              </button>
            </div>
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">Hussein Ali</h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            خبير في الأمن السيبراني وحماية المعلومات | متخصص في اختبار اختراق تطبيقات الويب والتحليل الجنائي الرقمي
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg border hover:bg-muted transition-colors">
              <Github className="h-6 w-6" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg border hover:bg-muted transition-colors">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg border hover:bg-muted transition-colors">
              <Linkedin className="h-6 w-6" />
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">نبذة عني</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed text-center">
              أنا خبير في الأمن السيبراني وحماية المعلومات، متخصص في اختبار اختراق تطبيقات الويب والتحليل الجنائي الرقمي. 
              لدي خبرة واسعة في مجال الأمن السيبراني وأعمل على تطوير مهاراتي باستمرار من خلال الحصول على شهادات معتمدة 
              وتنفيذ مشاريع ناجحة. أهدف إلى مساعدة المؤسسات والأفراد على حماية أنظمتهم وبياناتهم من التهديدات السيبرانية.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">50+</div>
                  <div className="text-sm text-muted-foreground">Successful Projects</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{certificates.length}</div>
                  <div className="text-sm text-muted-foreground">Certifications</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">7+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">100+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">الشهادات والاعتمادات</h2>
          {certificates.length === 0 ? (
            <p className="text-center text-muted-foreground">لا توجد شهادات متاحة حالياً</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <Card key={cert._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {cert.imageUrl && (
                    <div className="relative w-full h-48 bg-muted">
                      <Image
                        src={cert.imageUrl}
                        alt={cert.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">{cert.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{cert.issuer}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(cert.issueDate)}</span>
                    </div>
                    {cert.certificateUrl && (
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        عرض الشهادة
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section id="blog" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">آخر المقالات والأخبار</h2>
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground">لا توجد مقالات متاحة حالياً</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {posts.map((post) => (
                  <Link key={post._id} href={`/blog/${post.slug || post._id}`}>
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
                        {post.category && (
                          <Badge variant="secondary" className="mb-2 w-fit">
                            {post.category}
                          </Badge>
                        )}
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h3>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="text-center">
                <Link href="/blog">
                  <Button variant="outline">عرض جميع المقالات</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Latest Courses */}
      <section id="courses" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">أحدث الدورات</h2>
          {courses.length === 0 ? (
            <p className="text-center text-muted-foreground">لا توجد دورات متاحة حالياً</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {course.featuredImage && (
                    <div className="relative w-full h-48 bg-muted">
                      <Image
                        src={course.featuredImage}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    {course.category && (
                      <Badge variant="secondary" className="mb-2">
                        {course.category}
                      </Badge>
                    )}
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <Link href={`/courses/${course._id}`}>
                      <Button className="w-full">عرض التفاصيل</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">اتصل بي</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">الاسم</label>
                <Input
                  id="name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">الرسالة</label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    إرسال الرسالة
                  </>
                )}
              </Button>
            </form>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">الموقع</h3>
                  </div>
                  <p className="text-muted-foreground">العراق، بابل</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">الهاتف</h3>
                  </div>
                  <p className="text-muted-foreground">+964 786 900 1400</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">البريد</h3>
                  </div>
                  <p className="text-muted-foreground">hussein.alhelo@example.com</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border hover:bg-muted transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border hover:bg-muted transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border hover:bg-muted transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Made with passion by مجتبى عبدالمطلب © 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
