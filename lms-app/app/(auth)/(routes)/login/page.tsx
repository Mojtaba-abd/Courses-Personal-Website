"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  // Check if user is already logged in on mount (client-side only)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // User is already logged in, redirect based on role
          const redirect = searchParams.get("redirect") || (user.role === "admin" ? "/dashboard" : "/");
          router.replace(redirect);
        }
      } catch (error) {
        // Not logged in, stay on login page
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { username, password },
        { withCredentials: true }
      );

      if (response.data.user) {
        toast.success("Login successful!");
        
        // Wait a moment for toast to show, then redirect based on role
        setTimeout(() => {
          const user = response.data.user;
          const redirect = searchParams.get("redirect") || (user.role === "admin" ? "/dashboard" : "/");
          router.replace(redirect);
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid credentials");
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="w-full max-w-md space-y-8 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;


