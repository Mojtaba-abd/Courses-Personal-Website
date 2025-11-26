import { IconBadge } from "@/components/icon-bage"
import { LucideIcon } from "lucide-react"

interface infoCardProps{
    icon: LucideIcon,
    label: string,
    numberOfItems: number,
    variant?:"default" | "success"
}


export const InfoCard = ({ icon: Icon, label, numberOfItems, variant}: infoCardProps) => {
    return(
        <div className="border border-gray-800 rounded-md flex items-center gap-x-2 p-3 bg-[#1a1a1a]">
            <IconBadge icon={Icon} variant={variant} />
            <div className="">
        <p className="font-medium text-white">
            {label}
        </p>
        <p className="text-gray-400 text-sm">
            {numberOfItems} {numberOfItems === 1? "Course" : "Courses"}
        </p>
            </div>
        </div>
    )
}