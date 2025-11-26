import { Logo } from "./logo";
import SidebarRoutes from "./sidebar-routes";

export const Sidebar = () => {
    return ( 
        <div className="h-full shadow-sm border-r border-gray-800 flex flex-col overflow-y-auto bg-[#0f0f0f]">
            <div className="flex flex-col w-full">
                <SidebarRoutes />
            </div>
        </div>
     );
}
 
export default Sidebar;