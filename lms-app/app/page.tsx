"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import LoginPage from "@/app/(auth)/(routes)/login/page";

export default function HomePage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // User is logged in, redirect to dashboard
          router.push("/dashboard");
        } else {
          // User is not logged in, show login form
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Not authenticated, show login form
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show login form if not authenticated
  return <LoginPage />;
}

