"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Redirect old route to new unified creation page
const CreatePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/teacher/courses/create");
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};

export default CreatePage;
