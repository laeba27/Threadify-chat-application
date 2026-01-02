"use client";

import { createBrowserApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ImageUploadBtnProps = {
  onImageUpload: (url: string) => void;
};

function ImageUploadButton({ onImageUpload }: ImageUploadBtnProps) {
  const { getToken } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleClick() {
    inputRef?.current?.click();
  }

  async function handleOnImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Image size must be less than 5MB",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload an image file",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading image:", file.name, file.size, file.type);

      const res = await apiClient.post("/api/upload/image-upload", formData);

      console.log("Upload response:", res);

      const url: string | undefined = res.data?.url;

      if (!url) {
        throw new Error("No image url is found in response");
      }

      onImageUpload(url);

      toast.success("Image uploaded successfully!", {
        description: "You can now send this image as message!",
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to upload image";
      toast.error("Upload failed", {
        description: errorMsg,
      });
    } finally {
      setUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleOnImageFileChange}
      />

      <Button
        size="icon"
        variant="ghost"
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="border-border/40 bg-card/60 text-muted-foreground hover:bg-card/90 hover:text-foreground"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export default ImageUploadButton;
