import NavbarRoutes from "@/components/navbar-routes"
import MobileSidebar from "./mobile-sidebar"

export const Navbar = () => {
    return(
        <div className="p-3 border-b border-gray-800 flex items-center h-full bg-[#0f0f0f] shadow-sm">
            <MobileSidebar />
            <NavbarRoutes />
        </div>
    )
}