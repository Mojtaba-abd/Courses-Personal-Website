"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { toast } from "react-hot-toast";
declare global {
  interface Window {
    particlesJS: any;
  }
}

interface Certificate {
  _id: string;
  title: string;
  issuer: string;
  issueDate: string;
  certificateUrl?: string;
  verificationLink?: string;
  imageUrl: string;
}

interface Course {
  _id: string;
  title: string;
  category?: string;
  featuredImage?: string;
  imageUrl?: string;
  description?: string;
  isPublished?: boolean;
  published?: boolean;
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
  isPublished?: boolean;
  published?: boolean;
}

const HomePage = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingIndexRef = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  const fullText = "خبير الأمن السيبراني";

  useEffect(() => {
    fetchData();
    initTyping();
    handleNavbarScroll();
    
    // Initialize particles after script loads
    const initParticles = () => {
      if (typeof window !== "undefined" && window.particlesJS) {
        const particlesElement = document.getElementById("particles-js");
        if (particlesElement) {
          try {
            // Clear any existing particles instance
            if ((particlesElement as any).pJS) {
              (particlesElement as any).pJS.fn.vendors.destroypJS();
            }
            
            window.particlesJS("particles-js", {
              "particles": {
                "number": { "value": 100, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#00ffcc" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#00ffcc", "opacity": 0.4, "width": 1 },
                "move": { "enable": true, "speed": 4, "direction": "none", "random": false, "straight": false, "out_mode": "out" }
              },
              "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }
              },
              "retina_detect": true
            });
            console.log("Particles initialized successfully");
          } catch (error) {
            console.error("Error initializing particles:", error);
          }
        } else {
          console.warn("Particles element not found");
        }
      }
    };
    
    // Retry mechanism for particles.js loading
    let retries = 0;
    const maxRetries = 50;
    const checkParticles = setInterval(() => {
      retries++;
      if (typeof window !== "undefined" && window.particlesJS) {
        clearInterval(checkParticles);
        // Small delay to ensure DOM is ready
        setTimeout(initParticles, 100);
      } else if (retries >= maxRetries) {
        clearInterval(checkParticles);
        console.warn("Particles.js failed to load after 5 seconds");
      }
    }, 100);
    
    // Initialize AOS after scripts load
    const initAOSDelayed = () => {
      if (typeof window !== "undefined" && (window as any).AOS) {
        (window as any).AOS.init({
          easing: "ease",
          duration: 1000,
          delay: 0,
        });
      } else {
        setTimeout(initAOSDelayed, 100);
      }
    };
    initAOSDelayed();
  }, []);


  const initTyping = () => {
    const type = () => {
      if (typingIndexRef.current < fullText.length) {
        setTypingText(fullText.substring(0, typingIndexRef.current + 1));
        typingIndexRef.current++;
        setTimeout(type, 100);
      } else {
        setTimeout(() => {
          typingIndexRef.current = 0;
          setTypingText("");
          setTimeout(type, 500);
        }, 2000);
      }
    };
    setTimeout(type, 500);
  };

  const handleNavbarScroll = () => {
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 50) {
          navRef.current.classList.add("scrolled");
        } else {
          navRef.current.classList.remove("scrolled");
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navMenuOpen && navRef.current && !navRef.current.contains(event.target as Node)) {
        setNavMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navMenuOpen]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const certsUrl = `${API_URL}/api/certificates/public`;
      let certsRes;
      try {
        certsRes = await axios.get(certsUrl, { withCredentials: false });
      } catch (err: any) {
        certsRes = { data: [] };
      }
      const allCertificates = Array.isArray(certsRes.data) ? certsRes.data : [];

      const postsUrl = `${API_URL}/api/posts`;
      let postsRes;
      try {
        postsRes = await axios.get(postsUrl, { withCredentials: false });
      } catch (err: any) {
        postsRes = { data: [] };
      }
      const allPosts = (postsRes.data || []).filter((p: Post) => p.isPublished || p.published);

      const coursesUrl = `${API_URL}/api/courses/public`;
      let coursesRes;
      try {
        coursesRes = await axios.get(coursesUrl, { withCredentials: false });
      } catch (err: any) {
        coursesRes = { data: [] };
      }
      const allCourses = Array.isArray(coursesRes.data)
        ? coursesRes.data.filter((c: Course) => c.isPublished || c.published === true)
        : [];

      setCertificates(allCertificates);
      setPosts(allPosts.slice(0, 3));
      setCourses(allCourses.slice(0, 3));
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("فشل تحميل البيانات. يرجى تحديث الصفحة.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/contact`, {
        name: contactForm.name,
        email: contactForm.email,
        message: `${contactForm.subject}\n\n${contactForm.message}`,
      });
      toast.success("تم إرسال رسالتك بنجاح!");
      setContactForm({ name: "", email: "", subject: "", message: "" });
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
    setNavMenuOpen(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-darker-bg text-text-primary overflow-x-hidden relative">
      <div id="particles-js" className="fixed inset-0 z-0 pointer-events-none w-full h-full" style={{ minHeight: '100vh' }} />

      {/* Navigation */}
      <nav
        ref={navRef}
        className="fixed top-0 w-full py-5 z-[1000] transition-all duration-300 bg-glass-bg backdrop-blur-[10px] border-b border-glass-border"
        data-aos="fade-down"
      >
        <div className="container mx-auto px-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5 text-2xl font-bold text-text-primary">
            <i className="fas fa-shield-halved text-secondary-old text-[1.8rem]" />
            <span>ShieldSec</span>
          </div>
          <div
            className={`md:flex items-center gap-8 ${
              navMenuOpen ? "flex flex-col fixed right-0 top-[70px] bg-glass-bg backdrop-blur-[20px] w-full p-8 border-t border-glass-border" : "hidden"
            }`}
          >
            <button onClick={() => scrollToSection("home")} className="nav-link text-text-secondary hover:text-secondary-old transition-colors font-medium relative pb-1">
              الرئيسية
            </button>
            <button onClick={() => scrollToSection("about")} className="nav-link text-text-secondary hover:text-secondary-old transition-colors font-medium relative pb-1">
              نبذة عني
            </button>
            <button onClick={() => scrollToSection("certificates")} className="nav-link text-text-secondary hover:text-secondary-old transition-colors font-medium relative pb-1">
              الشهادات
            </button>
            <button onClick={() => scrollToSection("blog")} className="nav-link text-text-secondary hover:text-secondary-old transition-colors font-medium relative pb-1">
              المدونة
            </button>
            <button onClick={() => scrollToSection("contact")} className="nav-link text-text-secondary hover:text-secondary-old transition-colors font-medium relative pb-1">
              تواصل معي
            </button>
            <Link href="/login" className="bg-gradient-2 px-5 py-2 rounded-[25px] text-white hover:-translate-y-0.5 hover:shadow-glow transition-all">
              <i className="fas fa-lock ml-2" /> لوحة التحكم
            </Link>
          </div>
          <button
            onClick={() => setNavMenuOpen(!navMenuOpen)}
            className="md:hidden text-2xl cursor-pointer text-text-primary"
          >
            <i className="fas fa-bars" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative pt-20">
        <div className="container mx-auto px-5">
          <div className="text-center max-w-[800px] mx-auto" data-aos="fade-up">
            <div className="w-[120px] h-[120px] mx-auto mb-8 flex items-center justify-center rounded-full bg-glass-bg backdrop-blur-[10px] border border-glass-border animate-float relative" data-aos="zoom-in" data-aos-delay="100">
              <div className="absolute -inset-[5px] rounded-full bg-gradient-cyber opacity-50 -z-10 animate-pulse-glow" />
              <i className="fas fa-user-secret text-5xl bg-gradient-cyber bg-clip-text text-transparent" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-5" data-aos="fade-up" data-aos-delay="200">
              Hussein <span className="bg-gradient-cyber bg-clip-text text-transparent">Ali</span>
            </h1>
            <p className="text-2xl text-secondary-old mb-5 min-h-[40px]" data-aos="fade-up" data-aos-delay="300">
              <span className="typing-text">{typingText}</span>
              <span className="animate-blink">|</span>
            </p>
            <p className="text-lg text-text-secondary mb-10" data-aos="fade-up" data-aos-delay="400">
              خبير في الأمن السيبراني وحماية المعلومات | متخصص في اختبار اختراق تطبيقات الويب والتحليل الجنائي الرقمي
            </p>
            <div className="flex gap-5 justify-center mb-10 flex-wrap" data-aos="fade-up" data-aos-delay="500">
              <button
                onClick={() => scrollToSection("about")}
                className="px-9 py-4 rounded-[50px] bg-gradient-2 text-white font-semibold inline-flex items-center gap-2.5 transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <i className="fas fa-user" /> تعرف علي
              </button>
              <button
                onClick={() => scrollToSection("blog")}
                className="px-9 py-4 rounded-[50px] bg-transparent border-2 border-secondary-old text-secondary-old font-semibold inline-flex items-center gap-2.5 transition-all hover:bg-secondary-old hover:text-dark-bg"
              >
                <i className="fas fa-newspaper" /> اقرأ المدونة
              </button>
            </div>
            <div className="flex gap-4 justify-center" data-aos="fade-up" data-aos-delay="600">
              <a href="#" className="w-12 h-12 flex items-center justify-center rounded-xl bg-glass-bg backdrop-blur-[10px] border border-glass-border text-text-primary transition-all hover:-translate-y-1 hover:bg-gradient-2 hover:shadow-glow">
                <i className="fab fa-linkedin" />
              </a>
              <a href="https://x.com/7cceiq?s=21" className="w-12 h-12 flex items-center justify-center rounded-xl bg-glass-bg backdrop-blur-[10px] border border-glass-border text-text-primary transition-all hover:-translate-y-1 hover:bg-gradient-2 hover:shadow-glow">
                <i className="fab fa-twitter" />
              </a>
              <a href="https://github.com/7cce" className="w-12 h-12 flex items-center justify-center rounded-xl bg-glass-bg backdrop-blur-[10px] border border-glass-border text-text-primary transition-all hover:-translate-y-1 hover:bg-gradient-2 hover:shadow-glow">
                <i className="fab fa-github" />
              </a>
              <a href="#" className="w-12 h-12 flex items-center justify-center rounded-xl bg-glass-bg backdrop-blur-[10px] border border-glass-border text-text-primary transition-all hover:-translate-y-1 hover:bg-gradient-2 hover:shadow-glow">
                <i className="fas fa-envelope" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative">
        <div className="container mx-auto px-5">
          <h2 className="text-4xl text-center mb-16 bg-gradient-cyber bg-clip-text text-transparent" data-aos="fade-up">
            <i className="fas fa-user-shield ml-4 text-secondary-old" /> نبذة عني
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 items-center">
            <div className="relative w-[220px] h-[300px] md:w-[380px] md:h-[670px] rounded-[20px] overflow-hidden bg-glass-bg shadow-[0_4px_15px_rgba(0,0,0,0.3)] mx-auto lg:mx-0">
              <Image
                src="/images/1.JPG"
                alt="صورة حسين الحلو"
                fill
                sizes="100vw"
                className="object-cover object-top transition-transform duration-400 hover:scale-105"
                unoptimized
              />
              <div className="absolute bottom-2.5 left-2.5 bg-gradient-to-r from-[#007bff] to-[#00d4ff] text-white px-3.5 py-1.5 rounded-[50px] text-sm flex items-center gap-1.5 shadow-[0_2px_10px_rgba(0,123,255,0.4)]">
                <i className="fas fa-shield-alt" />
                <span>معتمد</span>
              </div>
            </div>
            <div data-aos="fade-left">
              <h3 className="text-3xl mb-5 bg-gradient-cyber bg-clip-text text-transparent">مرحباً بك في عالم الأمن السيبراني</h3>
              <p className="text-lg text-text-secondary leading-relaxed mb-8">
                أنا حسين الحلو، خبير أمن سيبراني متخصص في حماية المعلومات واختبار الاختراق. أمتلك خبرة واسعة في تأمين الأنظمة والشبكات،
                ومساعدة الشركات على حماية بياناتها من التهديدات الإلكترونية.
              </p>
              <div className="grid grid-cols-2 gap-5">
                <div className="p-6 text-center bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl transition-all hover:-translate-y-1 hover:shadow-glow-2">
                  <i className="fas fa-award text-4xl mb-4 bg-gradient-cyber bg-clip-text text-transparent" />
                  <h4 className="text-3xl mb-2.5 text-secondary-old">+4</h4>
                  <p className="text-text-secondary text-sm">شهادة احترافية</p>
                </div>
                <div className="p-6 text-center bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl transition-all hover:-translate-y-1 hover:shadow-glow-2">
                  <i className="fas fa-project-diagram text-4xl mb-4 bg-gradient-cyber bg-clip-text text-transparent" />
                  <h4 className="text-3xl mb-2.5 text-secondary-old">+50</h4>
                  <p className="text-text-secondary text-sm">مشروع ناجح</p>
                </div>
                <div className="p-6 text-center bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl transition-all hover:-translate-y-1 hover:shadow-glow-2">
                  <i className="fas fa-users text-4xl mb-4 bg-gradient-cyber bg-clip-text text-transparent" />
                  <h4 className="text-3xl mb-2.5 text-secondary-old">+100</h4>
                  <p className="text-text-secondary text-sm">عميل راضٍ</p>
                </div>
                <div className="p-6 text-center bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl transition-all hover:-translate-y-1 hover:shadow-glow-2">
                  <i className="fas fa-clock text-4xl mb-4 bg-gradient-cyber bg-clip-text text-transparent" />
                  <h4 className="text-3xl mb-2.5 text-secondary-old">+7</h4>
                  <p className="text-text-secondary text-sm">سنوات خبرة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificates Section */}
      <section id="certificates" className="py-24 relative">
        <div className="container mx-auto px-5">
          <h2 className="text-4xl text-center mb-16 bg-gradient-cyber bg-clip-text text-transparent" data-aos="fade-up">
            <i className="fas fa-certificate ml-4 text-secondary-old" /> الشهادات والاعتمادات
          </h2>
          {isLoading ? (
            <p className="text-center col-span-full">جاري تحميل الشهادات...</p>
          ) : certificates.length === 0 ? (
            <p className="text-center col-span-full">لا توجد شهادات متاحة حالياً</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="p-8 transition-all relative overflow-hidden bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl hover:-translate-y-2.5 hover:shadow-glow group"
                >
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-cyber opacity-0 group-hover:opacity-10 transition-opacity -z-10" />
                  {cert.imageUrl && (
                    <div className="relative w-full h-48 mb-5 rounded-xl overflow-hidden">
                      <Image
                        src={cert.imageUrl}
                        alt={cert.title}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <h3 className="text-xl mb-2.5">{cert.title}</h3>
                  <p className="text-secondary-old mb-2.5">{cert.issuer}</p>
                  <p className="text-text-secondary text-sm mb-4">{formatDate(cert.issueDate)}</p>
                  {(cert.certificateUrl || cert.verificationLink) && (
                    <a
                      href={cert.certificateUrl || cert.verificationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-[50px] bg-gradient-2 text-white font-semibold inline-flex items-center gap-2 text-sm transition-all hover:-translate-y-0.5 hover:shadow-glow"
                    >
                      <i className="fas fa-shield-check" /> تحقق من الأصالة
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-24 relative">
        <div className="container mx-auto px-5">
          <h2 className="text-4xl text-center mb-16 bg-gradient-cyber bg-clip-text text-transparent" data-aos="fade-up">
            <i className="fas fa-blog ml-4 text-secondary-old" /> آخر المقالات والأخبار
          </h2>
          {isLoading ? (
            <p className="text-center col-span-full">جاري تحميل المقالات...</p>
          ) : posts.length === 0 ? (
            <p className="text-center col-span-full">لا توجد مقالات منشورة حالياً</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {posts.map((post) => (
                  <Link key={post._id} href={`/blog/${post.slug || post._id}`}>
                    <div className="overflow-hidden transition-all hover:-translate-y-2.5 hover:shadow-glow bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl">
                      <div className="w-full h-48 bg-gradient-cyber flex items-center justify-center text-5xl text-white/30 relative overflow-hidden">
                        {post.featuredImage ? (
                          <Image src={post.featuredImage} alt={post.title} fill sizes="100vw" className="object-cover" />
                        ) : (
                          <i className="fas fa-newspaper" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-darker-bg" />
                      </div>
                      <div className="p-6">
                        <div className="flex gap-5 mb-4 text-sm text-text-secondary">
                          <span>
                            <i className="fas fa-calendar ml-1.5 text-secondary-old" />
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-xl mb-4">{post.title}</h3>
                        <p className="text-text-secondary leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
                        <span className="text-secondary-old font-semibold inline-flex items-center gap-1.5 transition-all hover:gap-2.5">
                          اقرأ المزيد <i className="fas fa-arrow-left" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center" data-aos="fade-up">
                <Link href="/blog" className="px-9 py-4 rounded-[50px] bg-gradient-2 text-white font-semibold inline-flex items-center gap-2.5 transition-all hover:-translate-y-1 hover:shadow-glow">
                  <i className="fas fa-arrow-left" /> عرض جميع المقالات
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-24 relative">
        <div className="container mx-auto px-5">
          <h2 className="text-4xl text-center mb-16 bg-gradient-cyber bg-clip-text text-transparent" data-aos="fade-up">
            <i className="fas fa-graduation-cap ml-4 text-secondary-old" /> الكورسات المتوفرة
          </h2>
          {isLoading ? (
            <p className="text-center col-span-full">جاري تحميل الكورسات...</p>
          ) : courses.length === 0 ? (
            <p className="text-center col-span-full">لا توجد كورسات متاحة حالياً</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className="overflow-hidden transition-all hover:-translate-y-2.5 hover:shadow-glow bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl"
                  >
                    <div className="w-full h-48 bg-gradient-cyber flex items-center justify-center text-5xl text-white/30 relative overflow-hidden">
                      {(course.featuredImage || course.imageUrl) ? (
                        <Image
                          src={course.featuredImage || course.imageUrl || ""}
                          alt={course.title}
                          fill
                          sizes="100vw"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <i className="fas fa-book" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-darker-bg" />
                    </div>
                    <div className="p-6">
                      {course.category && (
                        <span className="inline-block px-3 py-1 rounded-full bg-gradient-2 text-white text-xs mb-3">
                          {course.category}
                        </span>
                      )}
                      <h3 className="text-xl mb-4">{course.title}</h3>
                      {course.description && (
                        <p className="text-text-secondary leading-relaxed mb-5 line-clamp-2">{course.description}</p>
                      )}
                      <Link
                        href={`/courses/${course._id}`}
                        className="px-6 py-3 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold inline-flex items-center gap-2 text-sm transition-colors w-full justify-center"
                      >
                        <i className="fas fa-arrow-left" /> عرض التفاصيل
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link href="/courses" className="px-9 py-4 rounded-[50px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold inline-flex items-center gap-2.5 transition-colors">
                  <i className="fas fa-arrow-left" /> عرض جميع الكورسات
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 relative">
        <div className="container mx-auto px-5">
          <h2 className="text-4xl text-center mb-16 bg-gradient-cyber bg-clip-text text-transparent" data-aos="fade-up">
            <i className="fas fa-envelope ml-4 text-secondary-old" /> تواصل معي
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
            <div className="flex flex-col gap-5">
              <div className="p-6 text-center bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl transition-all hover:-translate-y-1 hover:shadow-glow-2" data-aos="fade-right">
                <i className="fas fa-map-marker-alt text-4xl mb-4 bg-gradient-cyber bg-clip-text text-transparent" />
                <h3 className="mb-2.5">الموقع</h3>
                <p className="text-text-secondary">العراق، بابل</p>
              </div>
              <div className="p-6 text-center bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl transition-all hover:-translate-y-1 hover:shadow-glow-2" data-aos="fade-right">
                <i className="fas fa-phone text-4xl mb-4 bg-gradient-cyber bg-clip-text text-transparent" />
                <h3 className="mb-2.5">الهاتف</h3>
                <p className="text-text-secondary">1400 900 786 964+</p>
              </div>
              <div className="p-6 text-center bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl transition-all hover:-translate-y-1 hover:shadow-glow-2" data-aos="fade-right">
                <i className="fas fa-envelope text-4xl mb-4 bg-gradient-cyber bg-clip-text text-transparent" />
                <h3 className="mb-2.5">البريد الإلكتروني</h3>
                <p className="text-text-secondary">hussein.alhelo@example.com</p>
              </div>
            </div>
            <form onSubmit={handleContactSubmit} className="p-10 bg-glass-bg backdrop-blur-[10px] border border-glass-border rounded-2xl" data-aos="fade-left">
              <div className="mb-6">
                <input
                  type="text"
                  id="contactName"
                  placeholder="الاسم"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full p-4 bg-white/5 border border-glass-border rounded-xl text-text-primary text-base transition-all focus:outline-none focus:border-secondary-old focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)]"
                />
              </div>
              <div className="mb-6">
                <input
                  type="email"
                  id="contactEmail"
                  placeholder="البريد الإلكتروني"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full p-4 bg-white/5 border border-glass-border rounded-xl text-text-primary text-base transition-all focus:outline-none focus:border-secondary-old focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)]"
                />
              </div>
              <div className="mb-6">
                <input
                  type="text"
                  id="contactSubject"
                  placeholder="الموضوع"
                  required
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full p-4 bg-white/5 border border-glass-border rounded-xl text-text-primary text-base transition-all focus:outline-none focus:border-secondary-old focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)]"
                />
              </div>
              <div className="mb-6">
                <textarea
                  id="contactMessage"
                  placeholder="الرسالة"
                  rows={5}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full p-4 bg-white/5 border border-glass-border rounded-xl text-text-primary text-base transition-all focus:outline-none focus:border-secondary-old focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] resize-y min-h-[120px]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-9 py-4 rounded-[50px] bg-gradient-2 text-white font-semibold inline-flex items-center gap-2.5 transition-all hover:-translate-y-1 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              >
                <i className="fas fa-paper-plane" /> {isSubmitting ? "جاري الإرسال..." : "إرسال الرسالة"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-darker-bg py-16 pt-24 border-t border-glass-border">
        <div className="container mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
            <div data-aos="fade-up">
              <h3 className="mb-5">
                <i className="fas fa-shield-halved text-secondary-old ml-2.5" /> Hussein Ali
              </h3>
              <p className="text-text-secondary mb-5">خبير الأمن السيبراني | حماية المعلومات | اختبار الاختراق</p>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 flex items-center justify-center rounded-xl bg-glass-bg backdrop-blur-[10px] border border-glass-border text-text-primary transition-all hover:-translate-y-1 hover:bg-gradient-2 hover:shadow-glow">
                  <i className="fab fa-linkedin" />
                </a>
                <a href="https://x.com/7cceiq?s=21" className="w-12 h-12 flex items-center justify-center rounded-xl bg-glass-bg backdrop-blur-[10px] border border-glass-border text-text-primary transition-all hover:-translate-y-1 hover:bg-gradient-2 hover:shadow-glow">
                  <i className="fab fa-twitter" />
                </a>
                <a href="https://github.com/7cce" className="w-12 h-12 flex items-center justify-center rounded-xl bg-glass-bg backdrop-blur-[10px] border border-glass-border text-text-primary transition-all hover:-translate-y-1 hover:bg-gradient-2 hover:shadow-glow">
                  <i className="fab fa-github" />
                </a>
              </div>
            </div>
            <div data-aos="fade-up" data-aos-delay="100">
              <h4 className="mb-5">روابط سريعة</h4>
              <ul className="list-none">
                <li className="mb-3">
                  <button onClick={() => scrollToSection("home")} className="text-text-secondary hover:text-secondary-old transition-all hover:pr-1.5">
                    الرئيسية
                  </button>
                </li>
                <li className="mb-3">
                  <button onClick={() => scrollToSection("about")} className="text-text-secondary hover:text-secondary-old transition-all hover:pr-1.5">
                    نبذة عني
                  </button>
                </li>
                <li className="mb-3">
                  <button onClick={() => scrollToSection("certificates")} className="text-text-secondary hover:text-secondary-old transition-all hover:pr-1.5">
                    الشهادات
                  </button>
                </li>
                <li className="mb-3">
                  <button onClick={() => scrollToSection("blog")} className="text-text-secondary hover:text-secondary-old transition-all hover:pr-1.5">
                    المدونة
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-glass-border">
            <p className="text-text-secondary mb-2.5">© 2025 حسين الحلو. جميع الحقوق محفوظة.</p>
            <p className="text-text-secondary mb-2.5">Made by مجتبى عبدالمطلب</p>
            <p className="text-secondary-old font-semibold">
              <i className="fas fa-lock ml-1.5" /> محمي بأعلى معايير الأمان
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
