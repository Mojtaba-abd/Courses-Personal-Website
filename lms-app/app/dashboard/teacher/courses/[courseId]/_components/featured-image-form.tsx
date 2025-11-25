"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface FeaturedImageFormProps {
  initialData: {
    featuredImage?: string;
  };
  courseId: string;
}

const FeaturedImageForm = ({ initialData, courseId }: FeaturedImageFormProps) => {
  const router = useRouter();
  const [featuredImage, setFeaturedImage] = useState(initialData.featuredImage || "");
  const [imagePreview, setImagePreview] = useState(initialData.featuredImage || "");
  const [isUploading, setIsUploading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        `${API_URL}/api/upload/image`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedUrl = response.data.url;
      setFeaturedImage(uploadedUrl);
      setImagePreview(uploadedUrl);

      // Save to course
      await axios.patch(
        `/api/courses/${courseId}`,
        { featuredImage: uploadedUrl },
        { withCredentials: true }
      );

      toast.success("Featured image uploaded successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    try {
      await axios.patch(
        `/api/courses/${courseId}`,
        { featuredImage: "" },
        { withCredentials: true }
      );
      setFeaturedImage("");
      setImagePreview("");
      toast.success("Featured image removed");
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to remove image");
    }
  };

  return (
    <div className="mt-6 bg-slate-100 border rounded-md p-4">
      <div className="font-semibold flex items-center justify-between mb-4">
        <Label>Featured Image</Label>
      </div>
      {imagePreview ? (
        <div className="relative w-full h-48 mb-2 border rounded-lg overflow-hidden">
          <Image
            src={imagePreview}
            alt="Featured image preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted hover:bg-muted/80 transition-colors">
          <label
            htmlFor="featured-image"
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          >
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, GIF up to 10MB
            </p>
          </label>
          <input
            id="featured-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Featured image displayed on course cards and listings
      </p>
    </div>
  );
};

export default FeaturedImageForm;

