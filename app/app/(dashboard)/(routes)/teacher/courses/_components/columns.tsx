"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { DropdownMenu,DropdownMenuContent ,DropdownMenuTrigger,DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "react-hot-toast"

export type course = {
    _id: string,
    title: string,
    price: number,
    isPublished: boolean
}

interface ColumnsProps {
  onDelete?: () => void;
}

export const createColumns = (onDelete?: () => void): ColumnDef<course>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-gray-300 hover:text-white hover:bg-gray-800"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const price = parseFloat(row.getValue("price") || "0")
        const formattedPrice = Intl.NumberFormat("en-US",{
            style:"currency",
            currency:"USD"
        }).format(price)

        return(<div className="">{formattedPrice}</div> )
    }
  },
  {
    accessorKey: "isPublished",
   header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Published
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const { isPublished } = row.original

        return(
            <div className="flex items-center justify-center">
            <Badge className={cn("px-3",isPublished ? "bg-green-600 text-white" : "bg-gray-600 text-white")}>
                {isPublished ? "Published" : "Draft"}
            </Badge>
            </div>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
        const { _id, title } = row.original
        const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
        const [isDeleting, setIsDeleting] = useState(false)
        const router = useRouter()
        const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000"

        const handleDelete = async () => {
            setIsDeleting(true)
            try {
                await axios.delete(`${API_URL}/api/courses/${_id}`, {
                    withCredentials: true
                })
                toast.success("Course deleted successfully")
                setDeleteDialogOpen(false)
                // Call the refetch callback if provided
                if (onDelete) {
                    onDelete()
                } else {
                    // Fallback: refresh router
                    router.refresh()
                    setTimeout(() => {
                        window.location.reload()
                    }, 500)
                }
            } catch (error: any) {
                toast.error(error.response?.data?.error || "Failed to delete course")
            } finally {
                setIsDeleting(false)
            }
        }

        return(
            <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-4 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800">
                        <span className="sr-only">
                            Open menu
                        </span>
                        <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-gray-800">
                    <Link href={`/dashboard/teacher/courses/${_id}`}>
                    <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 hover:text-white">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-500 hover:bg-gray-800 hover:text-red-400"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the course
                            "{title}" and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </>
        )
    }
  }
]

// Export default columns for backward compatibility
export const columns = createColumns()
