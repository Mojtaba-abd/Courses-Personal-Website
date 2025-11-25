"use client";

import { useEffect, useRef } from "react";

interface ProtectedYouTubePlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

export const ProtectedYouTubePlayer = ({
  videoUrl,
  title,
  className = "",
}: ProtectedYouTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract YouTube video ID
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(videoUrl);
  if (!videoId) {
    return (
      <div className={`flex items-center justify-center bg-neutral-800 text-white p-8 ${className}`}>
        <p>Invalid YouTube URL</p>
      </div>
    );
  }

  // Protected embed URL with security parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&controls=1&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3`;

  useEffect(() => {
    // Disable right-click on the entire page
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+P (Print)
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative aspect-video ${className}`}>
      {/* Transparent overlay to block interactions */}
      <div className="absolute inset-0 z-10 pointer-events-none" />
      
      {/* YouTube iframe with protection parameters */}
      <iframe
        src={embedUrl}
        title={title || "YouTube video player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false}
        className="w-full h-full border-0"
        style={{ pointerEvents: "auto" }}
      />
    </div>
  );
};

