/**
 * components/ui/icon-resolver.tsx
 * Clean, modern Lucide icon mapping to replace all raw emojis across dotdive.
 */
import React from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  Lock,
  BookOpen,
  Shield,
  Search,
  GitBranch,
  Terminal,
  Cpu,
  Layers,
  Database,
  Key,
  Settings,
  Sparkles,
  Compass,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Globe,
  Share2,
  Workflow,
  CheckCircle2,
  FileCode,
  Code2,
  Boxes,
} from "lucide-react";

interface IconResolverProps {
  name?: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  fallback?: "file" | "folder";
}

export function IconResolver({
  name,
  className = "text-neutral-400",
  size = 14,
  strokeWidth = 1.75,
  fallback = "file",
}: IconResolverProps) {
  if (!name) {
    return fallback === "folder" ? (
      <Folder size={size} strokeWidth={strokeWidth} className={className} />
    ) : (
      <FileText size={size} strokeWidth={strokeWidth} className={className} />
    );
  }

  const key = name.toLowerCase().trim();

  // Keyword mapping for clean, consistent icons
  if (key.includes("auth") || key.includes("login") || key.includes("امنیت") || key.includes("🔐") || key.includes("🔒")) {
    return <Lock size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("token") || key.includes("توکن") || key.includes("کلید")) {
    return <Key size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("backend") || key.includes("بک‌اند") || key.includes("server") || key.includes("سرور")) {
    return <Cpu size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("frontend") || key.includes("فرانت") || key.includes("ui") || key.includes("رابط")) {
    return <Layers size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("api") || key.includes("contract") || key.includes("sdk")) {
    return <FileCode size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("architecture") || key.includes("معماری")) {
    return <Workflow size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("diagram") || key.includes("دیاگرام") || key.includes("flow")) {
    return <Workflow size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("database") || key.includes("پایگاه") || key.includes("storage") || key.includes("ذخیره")) {
    return <Database size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("git") || key.includes("branch") || key.includes("گیت")) {
    return <GitBranch size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("standard") || key.includes("policy") || key.includes("دستورالعمل") || key.includes("سیاست")) {
    return <CheckCircle2 size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("doc") || key.includes("guide") || key.includes("مستندات") || key.includes("راهنما")) {
    return <BookOpen size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("platform") || key.includes("پلتفرم") || key.includes("package") || key.includes("پکیج")) {
    return <Boxes size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("terminal") || key.includes("cli")) {
    return <Terminal size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("public") || key.includes("عمومی") || key.includes("web")) {
    return <Globe size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("setting") || key.includes("تنظیمات")) {
    return <Settings size={size} strokeWidth={strokeWidth} className={className} />;
  }
  if (key.includes("nons") || key.includes("lemmo")) {
    return <Compass size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Fallback
  return fallback === "folder" ? (
    <Folder size={size} strokeWidth={strokeWidth} className={className} />
  ) : (
    <FileText size={size} strokeWidth={strokeWidth} className={className} />
  );
}
