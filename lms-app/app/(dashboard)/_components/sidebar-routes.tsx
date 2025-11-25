"use client"

import {Compass, Layout,List} from "lucide-react"
import SidebarItem from "./sidebar-item";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

const guestRoutes = [
    {
        icon: Layout,
        label: "Dashboard",
        href: "/dashboard"
    },
    {
        icon: Compass,
        label: "Browse",
        href: "/dashboard/courses"
    }
]

const teacherRoutes = [
    {
        icon: List,
        label: "Courses",
        href: "/dashboard/teacher/courses"
    }
]

const SidebarRoutes = () => {
    const pathname = usePathname();
    const { user } = useAuth();

    const isTeacher = user?.role === "teacher" || user?.role === "admin";
    const routes = isTeacher ? teacherRoutes : guestRoutes;



    return ( 
        <div className="flex flex-col w-full">
        {routes.map((route) => {
            return(
                <SidebarItem 
                    key={route.href}
                    icon={route.icon}
                    label={route.label}
                    href={route.href}
            />
            )
        })}                   
        </div>
     );
}
 
export default SidebarRoutes;