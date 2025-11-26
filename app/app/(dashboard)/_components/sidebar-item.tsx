import { usePathname, useRouter } from "next/navigation"

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";


interface sidebarItemProps {
    icon: LucideIcon,
    label: string,
    href: string
}

const SidebarItem = ({ icon: Icon, label, href }: sidebarItemProps) => {

    const pathname = usePathname()
    const router = useRouter()

    const onClick = () => {
        router.push(href)
    }

    const isActive = (pathname === "/" && href === "/") || (pathname === href) || (pathname.startsWith(`${href}/`))

    return (
        <button
            onClick={onClick}
            type="button"
            className={cn("flex items-center gap-x-2 text-gray-400 text-sm font-[500] pl-6 transition-all hover:text-white hover:bg-gray-800 relative", isActive && "text-white font-[600] bg-cyan-600 hover:bg-cyan-600")}
        >
            <div className="flex items-center gap-x-2 py-4">
                <Icon  
                size={22}
                className={cn("text-gray-400",isActive && "text-white")} />
                {label}
            </div>
            {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-cyan-600" />
            )}
        </button>
    );
}

export default SidebarItem;