"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "./search-input";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavbarRoutes = () => {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const isTeacherPage = pathname?.startsWith("/dashboard/teacher");
  const isCoursePage = pathname?.includes("/courses") && !pathname?.startsWith("/dashboard/teacher");
  const isSearchPage = pathname === "/dashboard/courses";
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      {isSearchPage && (
        <div className="hidden md:block">
          <SearchInput />
        </div>
      )}
      <div className="flex gap-x-2 ml-auto text-white items-center">
        {user ? (
          <>
            <span className="text-sm font-medium">{user.username}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-gray-800">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button size="sm" variant={"default"} className="bg-cyan-600 hover:bg-cyan-700">
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </>
  );
};

export default NavbarRoutes;
