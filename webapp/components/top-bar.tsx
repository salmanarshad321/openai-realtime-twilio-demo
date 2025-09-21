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
    </div>
  );
};

export default TopBar;
