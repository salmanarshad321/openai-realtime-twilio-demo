import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";

const TopBar = () => {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Call Assistant</h1>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" size="sm">
          <Link
            href="https://platform.openai.com/docs/guides/realtime"
            className="flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default TopBar;
