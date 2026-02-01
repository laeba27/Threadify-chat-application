"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  Bold,
  Italic,
  Underline,
  Link2,
  Smile,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Image as ImageIcon,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { createBrowserApiClient } from "@/lib/api-client";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your description...",
  disabled = false,
  rows = 8,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { getToken } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    setTimeout(() => {
      handleInput();
      editorRef.current?.focus();
    }, 0);
  };

  const insertList = (ordered: boolean) => {
    if (ordered) {
      execCommand("insertOrderedList");
    } else {
      execCommand("insertUnorderedList");
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL (e.g., https://example.com):");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertEmoji = () => {
    const emoji = prompt("Enter emoji or text:", "😊");
    if (emoji) {
      document.execCommand("insertText", false, emoji);
      setTimeout(() => {
        handleInput();
        editorRef.current?.focus();
      }, 0);
    }
  };

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please upload an image smaller than 5MB",
        });
        return;
      }

      try {
        setIsUploadingImage(true);
        
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);

        console.log("Uploading image to Cloudinary:", file.name);

        const res = await apiClient.post("/api/upload/image-upload", formData);
        const imageUrl = res.data?.url;

        if (!imageUrl) {
          throw new Error("No image URL returned from server");
        }

        console.log("Image uploaded successfully:", imageUrl);

        // Insert image with Cloudinary URL
        const img = document.createElement("img");
        img.src = imageUrl;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.borderRadius = "4px";
        img.style.marginTop = "8px";
        img.style.marginBottom = "8px";

        if (editorRef.current) {
          editorRef.current.appendChild(img);
          handleInput();
        }

        toast.success("Image uploaded", {
          description: "Image has been added to your thread",
        });
      } catch (error: any) {
        console.error("Error uploading image:", error);
        const errorMsg = error?.response?.data?.error || error?.message || "Failed to upload image";
        toast.error("Upload failed", {
          description: errorMsg,
        });
      } finally {
        setIsUploadingImage(false);
      }
    };

    input.click();
  };

  const formatButton = (
    icon: React.ReactNode,
    title: string,
    onClick: () => void,
    isLoading?: boolean
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className="p-2 hover:bg-background/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      aria-label={title}
    >
      {isLoading ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        icon
      )}
    </button>
  );

  return (
    <div className="space-y-2 border border-border rounded-md bg-background/50 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 bg-sidebar/40 p-3 border-b border-border items-center">
        <div className="flex gap-1 items-center border-r border-border pr-2">
          {formatButton(
            <Bold className="w-4 h-4" />,
            "Bold (Ctrl+B)",
            () => execCommand("bold")
          )}
          {formatButton(
            <Italic className="w-4 h-4" />,
            "Italic (Ctrl+I)",
            () => execCommand("italic")
          )}
          {formatButton(
            <Underline className="w-4 h-4" />,
            "Underline (Ctrl+U)",
            () => execCommand("underline")
          )}
        </div>

        <div className="flex gap-1 items-center border-r border-border pr-2">
          {formatButton(
            <Heading2 className="w-4 h-4" />,
            "Heading",
            () => execCommand("formatBlock", "<h2>")
          )}
        </div>

        <div className="flex gap-1 items-center border-r border-border pr-2">
          {formatButton(
            <AlignLeft className="w-4 h-4" />,
            "Align Left",
            () => execCommand("justifyLeft")
          )}
          {formatButton(
            <AlignCenter className="w-4 h-4" />,
            "Align Center",
            () => execCommand("justifyCenter")
          )}
          {formatButton(
            <AlignRight className="w-4 h-4" />,
            "Align Right",
            () => execCommand("justifyRight")
          )}
        </div>

        <div className="flex gap-1 items-center border-r border-border pr-2">
          {formatButton(
            <List className="w-4 h-4" />,
            "Bullet List",
            () => insertList(false)
          )}
          {formatButton(
            <ListOrdered className="w-4 h-4" />,
            "Numbered List",
            () => insertList(true)
          )}
        </div>

        <div className="flex gap-1 items-center border-r border-border pr-2">
          {formatButton(
            <Link2 className="w-4 h-4" />,
            "Insert Link",
            insertLink
          )}
          {formatButton(
            <Smile className="w-4 h-4" />,
            "Add Emoji",
            insertEmoji
          )}
          {formatButton(
            <ImageIcon className="w-4 h-4" />,
            "Insert Image",
            handleImageUpload,
            isUploadingImage
          )}
        </div>

        <div className="flex gap-1 items-center">
          <button
            type="button"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.innerHTML = "";
                onChange("");
              }
            }}
            disabled={disabled}
            title="Clear All"
            className="p-2 hover:bg-background/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-500/70 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onBlur={handleInput}
        suppressContentEditableWarning
        className="min-h-96 p-4 focus:outline-none text-foreground text-sm bg-background resize-none overflow-auto [&>*]:text-foreground [&>p]:text-foreground [&>h1]:text-foreground [&>h2]:text-foreground [&>h3]:text-foreground [&>ul]:text-foreground [&>ol]:text-foreground [&>li]:text-foreground [&>a]:text-primary [&>a]:hover:text-primary/80 [&>strong]:text-foreground [&>b]:text-foreground [&>em]:text-foreground [&>i]:text-foreground"
        style={{
          minHeight: `${rows * 1.5}rem`,
          maxHeight: "600px",
        }}
        role="textbox"
        aria-label="Thread description editor"
      />

      {/* Character count helper */}
      <div className="text-xs text-muted-foreground px-4 py-2 border-t border-border bg-background/30">
        Content length: {value.replace(/<[^>]*>/g, "").length} characters
      </div>
    </div>
  );
}
