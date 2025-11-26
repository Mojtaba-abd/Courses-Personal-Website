"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  onChange: (value: string) => void;
  value: string;
}

export const RichTextEditor = ({ onChange, value }: RichTextEditorProps) => {
  const quillRef = useRef<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    []
  );

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

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

        const imageUrl = response.data.url;
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, "image", imageUrl);
          quill.setSelection(index + 1);
        }
        toast.success("Image uploaded successfully");
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error.response?.data?.error || "Failed to upload image");
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          [{ align: [] }],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    []
  );

  return (
    <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg overflow-hidden rich-text-editor-dark">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder="Start writing your post..."
        className="min-h-[400px]"
      />
    </div>
  );
};

