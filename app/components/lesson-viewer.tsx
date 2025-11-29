"use client";

import { ProtectedYouTubePlayer } from "./protected-youtube-player";
import { File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LessonAttachment {
  name: string;
  url: string;
  type: "pdf" | "zip" | "other";
  size?: number;
}

interface LessonViewerProps {
  title: string;
  content?: string;
  description?: string;
  videoUrl?: string;
  lessonType?: "video" | "text";
  attachments?: LessonAttachment[];
  className?: string;
}

export const LessonViewer = ({
  title,
  content,
  description,
  videoUrl,
  lessonType,
  attachments = [],
  className = "",
}: LessonViewerProps) => {
  // Determine lesson type: use provided type, or infer from content
  const type = lessonType || (videoUrl ? "video" : "text");
  const isVideoLesson = type === "video";
  const isTextLesson = type === "text";

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* YouTube Video - Only show for video lessons */}
          {isVideoLesson && videoUrl && (
            <>
              <div className="w-full">
                <ProtectedYouTubePlayer videoUrl={videoUrl} title={title} />
              </div>
              {isTextLesson && content && <Separator />}
            </>
          )}

          {/* Rich Text Content - Only show for text lessons */}
          {isTextLesson && content && (
            <div
              className="prose prose-lg prose-slate max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{attachment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {attachment.type.toUpperCase()}
                            {attachment.size && ` • ${(attachment.size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

