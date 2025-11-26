"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

interface CategoryInputFormProps {
  initialData: {
    category?: string;
  };
  courseId: string;
}

const CATEGORIES = [
  "Cybersecurity",
  "Web Development",
  "Networking",
  "DevOps",
  "Cloud Computing",
  "Data Science",
  "Machine Learning",
  "Mobile Development",
  "Database",
  "Programming",
  "Other",
];

const CategoryInputForm = ({ initialData, courseId }: CategoryInputFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [category, setCategory] = useState(initialData.category || "");

  const toggleEdit = () => setIsEditing((cur) => !cur);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.patch(
        `/api/courses/${courseId}`,
        { category },
        { withCredentials: true }
      );
      toast.success("Category updated successfully");
      toggleEdit();
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update category");
    }
  };

  return (
    <div className="mt-6 bg-slate-100 border rounded-md p-4">
      <div className="font-semibold flex items-center justify-between">
        Course Category
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p className="mt-2 text-sm">
          {category || <span className="text-slate-500 italic">No category set</span>}
        </p>
      )}
      {isEditing && (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-x-2">
            <Button type="button" variant="outline" onClick={toggleEdit}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CategoryInputForm;

