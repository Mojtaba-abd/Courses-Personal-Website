"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./_components/navbar";
import Sidebar from "./_components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [domLoaded, setDomLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setDomLoaded(true);
    
    // Check authentication on client side only
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
        } else {
          // Not authenticated, redirect to login
          router.push("/login");
        }
      } catch (error) {
        // Not authenticated, redirect to login
        router.push("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  if (!domLoaded || isCheckingAuth) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via router.push
  }

  return (
    <div className="h-full bg-[#0f0f0f]">
      <div className="h-[80px] md:pl-56 fixed top-0 left-0 right-0 w-full z-50">
        <Navbar />
      </div>
      <div className="h-full hidden md:flex flex-col w-56 fixed top-0 left-0 bottom-0 border-r border-gray-800 z-50">
        <Sidebar />
      </div>
      <main className="h-full pt-[80px] md:pl-56 bg-[#0f0f0f] text-white">{children}</main>
    </div>
  );
};

export default DashboardLayout;
