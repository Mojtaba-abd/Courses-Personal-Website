"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, forwardRef, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReactQuill = dynamic(() => import("react-quill"), { 
  ssr: false,
  loading: () => <div className="min-h-[400px] bg-[#0f0f0f] border border-gray-800 rounded-lg flex items-center justify-center text-gray-400">Loading editor...</div>
});

interface RichTextEditorProps {
  onChange: (value: string) => void;
  value: string;
}

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(({ onChange, value }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8000";

  // Find and store Quill instance after mount
  useEffect(() => {
    if (editorRef.current) {
      const quillElement = editorRef.current.querySelector('.ql-container');
      if (quillElement && (quillElement as any).__quill) {
        quillInstanceRef.current = (quillElement as any).__quill;
      }
    }
  }, [value]); // Re-check when value changes (editor might re-render)

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
        // Use stored Quill instance or find it
        let quill = quillInstanceRef.current;
        if (!quill && editorRef.current) {
          const quillElement = editorRef.current.querySelector('.ql-container');
          if (quillElement && (quillElement as any).__quill) {
            quill = (quillElement as any).__quill;
            quillInstanceRef.current = quill;
          }
        }
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

  // Combine refs: internal ref for Quill access and forwarded ref
  const combinedRef = useMemo(() => {
    return (node: HTMLDivElement | null) => {
      // @ts-ignore - editorRef is mutable, TypeScript sometimes incorrectly infers readonly
      editorRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        // Handle ref object - use type assertion to work around readonly typing
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ref as any).current = node;
        } catch {
          // If assignment fails, it's likely a readonly ref - that's okay
        }
      }
    };
  }, [ref]);

  return (
    <div 
      ref={combinedRef}
      className="bg-[#0f0f0f] border border-gray-800 rounded-lg overflow-hidden rich-text-editor-dark"
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder="Start writing your post..."
        className="min-h-[400px]"
      />
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";

